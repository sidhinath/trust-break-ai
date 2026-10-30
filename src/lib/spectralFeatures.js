import FFT from 'fft.js'

/**
 * GhostNet AI — Voice & Deepfake Acoustic Feature Extraction
 *
 * Computes Spectral Flatness Measure (SFM) across audio frames using FFT.js.
 * SFM = (Geometric Mean of Power Spectrum) / (Arithmetic Mean of Power Spectrum)
 *
 * Range: 0.0 (pure tone / resonant) to 1.0 (white noise).
 * Synthetic/TTS voices frequently show unnatural spectral distribution or harmonic compression.
 */
export function computeSpectralFlatness(channelData, frameSize = 1024) {
  if (!channelData || channelData.length < frameSize) {
    return 0.5 // default baseline
  }

  const fft = new FFT(frameSize)
  const numFrames = Math.floor(channelData.length / frameSize)
  const maxFramesToAnalyze = Math.min(numFrames, 64) // sample up to 64 frames
  const frameStep = Math.max(1, Math.floor(numFrames / maxFramesToAnalyze))

  let totalFlatness = 0
  let validFrames = 0

  const out = fft.createComplexArray()
  const eps = 1e-12

  for (let f = 0; f < maxFramesToAnalyze; f++) {
    const startIndex = f * frameStep * frameSize
    if (startIndex + frameSize > channelData.length) break

    // Window the frame (Hann window)
    const frame = new Array(frameSize)
    for (let i = 0; i < frameSize; i++) {
      const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frameSize - 1)))
      frame[i] = channelData[startIndex + i] * window
    }

    fft.realTransform(out, frame)
    fft.completeSpectrum(out)

    // Calculate power spectrum for positive frequencies
    const halfSize = frameSize / 2
    let logSum = 0
    let linSum = 0

    for (let k = 0; k < halfSize; k++) {
      const real = out[2 * k]
      const imag = out[2 * k + 1]
      const power = real * real + imag * imag + eps
      logSum += Math.log(power)
      linSum += power
    }

    const geomMean = Math.exp(logSum / halfSize)
    const arithMean = linSum / halfSize

    if (arithMean > eps) {
      const flatness = geomMean / arithMean
      totalFlatness += Math.max(0, Math.min(1, flatness))
      validFrames++
    }
  }

  return validFrames > 0 ? totalFlatness / validFrames : 0.5
}

/**
 * Combines NLP-derived risk score with acoustic anomaly signal.
 * Formula: finalScore = textRiskScore * 0.75 + acousticSignal * 25
 */
export function combineVoiceThreatScore(textRiskScore, spectralFlatness) {
  // Deepfake/synthetic speech often shows extreme flatness (<0.08 or >0.70)
  let acousticSignal = 0
  if (spectralFlatness < 0.12) {
    // Unnaturally harmonic / robotic compression
    acousticSignal = 0.8
  } else if (spectralFlatness > 0.65) {
    // Unnaturally noisy or vocoder hiss
    acousticSignal = 0.7
  } else {
    // Typical human conversational bandwidth
    acousticSignal = 0.2
  }

  const combined = (textRiskScore * 0.75) + (acousticSignal * 25)
  return Math.min(100, Math.max(0, Math.round(combined)))
}
