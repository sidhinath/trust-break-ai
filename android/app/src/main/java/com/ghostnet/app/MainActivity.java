package com.ghostnet.app;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private TextToSpeech tts;
    private boolean ttsReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            tts = new TextToSpeech(this, status -> {
                if (status == TextToSpeech.SUCCESS) {
                    ttsReady = true;
                    tts.setLanguage(new Locale("en", "IN"));
                    tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                        @Override
                        public void onStart(String utteranceId) {}

                        @Override
                        public void onDone(String utteranceId) {
                            runOnUiThread(() -> {
                                bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('android_tts_done'));", null);
                            });
                        }

                        @Override
                        public void onError(String utteranceId) {
                            runOnUiThread(() -> {
                                bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('android_tts_error'));", null);
                            });
                        }
                    });
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new Object() {
                @JavascriptInterface
                public boolean isAvailable() {
                    return true;
                }

                @JavascriptInterface
                public void speak(String text, String lang, float rate) {
                    if (text == null || text.trim().isEmpty()) return;
                    runOnUiThread(() -> {
                        try {
                            if (tts == null) {
                                tts = new TextToSpeech(MainActivity.this, status -> {
                                    if (status == TextToSpeech.SUCCESS) {
                                        ttsReady = true;
                                        doSpeak(text, lang, rate);
                                    }
                                });
                            } else {
                                doSpeak(text, lang, rate);
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    });
                }

                private void doSpeak(String text, String lang, float rate) {
                    try {
                        if (lang != null && lang.toLowerCase().startsWith("hi")) {
                            int res = tts.setLanguage(new Locale("hi", "IN"));
                            if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                                tts.setLanguage(Locale.ENGLISH);
                            }
                        } else if (lang != null && lang.toLowerCase().contains("us")) {
                            tts.setLanguage(Locale.US);
                        } else {
                            tts.setLanguage(new Locale("en", "IN"));
                        }
                        tts.setSpeechRate(rate);
                        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "GhostNetTTS_" + System.currentTimeMillis());
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                @JavascriptInterface
                public void stop() {
                    runOnUiThread(() -> {
                        try {
                            if (tts != null) {
                                tts.stop();
                            }
                        } catch (Exception e) {}
                    });
                }
            }, "AndroidNativeTTS");
        }
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            try {
                tts.stop();
                tts.shutdown();
            } catch (Exception e) {}
        }
        super.onDestroy();
    }
}
