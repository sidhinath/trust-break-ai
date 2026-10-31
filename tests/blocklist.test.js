import test from "node:test";
import assert from "node:assert/strict";
import blocklistLiteHandler from "../api/blocklist-lite.js";

function createResponse() {
  const state = { status: 200, body: "", headers: {} };

  const response = {
    setHeader(key, value) {
      state.headers[key.toLowerCase()] = value;
    },
    status(code) {
      state.status = code;
      return {
        send(body) {
          state.body = String(body ?? "");
        },
        end() {},
      };
    },
    end() {},
  };

  return { response, state };
}

function withEnv(values, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
}

const supabaseEnv = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  ENABLE_PRE_CLICK_INTERCEPTOR: "true",
};

test("blocklist-lite returns 404 when explicitly disabled", async () => {
  await withEnv(
    {
      ...supabaseEnv,
      ENABLE_PRE_CLICK_INTERCEPTOR: "false",
    },
    async () => {
      const { response, state } = createResponse();
      await blocklistLiteHandler({ method: "GET" }, response);
      assert.equal(state.status, 404);
      assert.match(state.body, /disabled/);
    }
  );
});

test("blocklist-lite is enabled by default (production kill switch)", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify([{ domain: "example.com" }]), { status: 200 });

  try {
    await withEnv(
      {
        ...supabaseEnv,
        ENABLE_PRE_CLICK_INTERCEPTOR: undefined,
      },
      async () => {
        const { response, state } = createResponse();
        await blocklistLiteHandler({ method: "GET" }, response);
        assert.equal(state.status, 200);
        assert.equal(state.body, "example.com\n");
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("blocklist-lite rejects non-GET requests", async () => {
  await withEnv(supabaseEnv, async () => {
    const { response, state } = createResponse();
    await blocklistLiteHandler({ method: "POST" }, response);
    assert.equal(state.status, 405);
  });
});

test("blocklist-lite returns 503 when the database is not configured", async () => {
  await withEnv(
    {
      SUPABASE_URL: undefined,
      VITE_SUPABASE_URL: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      SUPABASE_ANON_KEY: undefined,
      VITE_SUPABASE_ANON_KEY: undefined,
      ENABLE_PRE_CLICK_INTERCEPTOR: "true",
    },
    async () => {
      const { response, state } = createResponse();
      await blocklistLiteHandler({ method: "GET" }, response);
      assert.equal(state.status, 503);
      assert.match(state.body, /not configured/);
    }
  );
});

test("blocklist-lite normalizes, validates, dedupes, and sorts domains", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";

  global.fetch = async (url) => {
    requestedUrl = String(url);
    return new Response(
      JSON.stringify([
        { domain: "Zeta.Example.com" },
        { domain: "example.com" },
        { domain: "https://Sub.Example.com/path?q=1" },
        { domain: "EXAMPLE.com" },
        { domain: "bad_domain" },
        { domain: "-leading-hyphen.com" },
        { domain: "trailing-hyphen-.com" },
        { domain: "" },
        { domain: null },
        { domain: "  spaced.example.com  " },
      ]),
      { status: 200 }
    );
  };

  try {
    await withEnv(supabaseEnv, async () => {
      const { response, state } = createResponse();
      await blocklistLiteHandler({ method: "GET" }, response);

      assert.equal(state.status, 200);
      assert.equal(
        state.body,
        "example.com\nspaced.example.com\nsub.example.com\nzeta.example.com\n"
      );
      assert.equal(state.headers["x-blocklist-count"], "4");
      assert.match(requestedUrl, /public_blocklist/);
      assert.match(requestedUrl, /domain=not\.is\.null/);
      assert.match(requestedUrl, /limit=4500/);
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("blocklist-lite returns 503 when the Supabase query fails", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => new Response("nope", { status: 500 });

  try {
    await withEnv(supabaseEnv, async () => {
      const { response, state } = createResponse();
      await blocklistLiteHandler({ method: "GET" }, response);
      assert.equal(state.status, 503);
      assert.match(state.body, /query failed/);
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("blocklist-lite returns 503 on network errors", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("connection reset");
  };

  try {
    await withEnv(supabaseEnv, async () => {
      const { response, state } = createResponse();
      await blocklistLiteHandler({ method: "GET" }, response);
      assert.equal(state.status, 503);
      assert.match(state.body, /Transient blocklist error/);
    });
  } finally {
    global.fetch = originalFetch;
  }
});
