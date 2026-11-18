import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture } from "./fixture.mjs";

function uploadFixture() {
  const writes = [];
  let compressed = 0;
  const f = fixture({
    "@/lib/server/media": {
      compressUploadedImage: async () => {
        compressed++;
        return new Uint8Array([1, 2, 3]).buffer;
      },
      getMediaBucket: async () => ({
        put: async (key, value, options) =>
          writes.push({
            key,
            bytes: new Uint8Array(await new Response(value).arrayBuffer()),
            options,
          }),
      }),
    },
  });
  const route = f.route("media");
  return {
    ...f,
    writes,
    compressed: () => compressed,
    upload: (kind, file, category) => {
      const body = new FormData();
      body.set("name", "Preview asset");
      body.set("sourceType", "upload");
      body.set("mediaKind", kind);
      body.set("file", file);
      if (category) body.set("categoryId", category);
      return route.POST(
        new Request("http://localhost/api/media", { method: "POST", body }),
      );
    },
  };
}

test("MP4 uploads preserve bytes, extension and MIME type without image compression", async () => {
  const f = uploadFixture();
  try {
    const bytes = new Uint8Array([
      0, 0, 0, 24, 102, 116, 121, 112, 109, 112, 52,
    ]);
    const response = await f.upload(
      "video",
      new File([bytes], "hero.mp4", { type: "video/mp4" }),
    );
    assert.equal(response.status, 201);
    assert.equal(f.compressed(), 0);
    assert.equal(f.writes.length, 1);
    assert.match(f.writes[0].key, /\.mp4$/);
    assert.equal(f.writes[0].options.httpMetadata.contentType, "video/mp4");
    assert.deepEqual(f.writes[0].bytes, bytes);
    const { id } = await response.json();
    assert.equal(
      f.sqlite
        .prepare("SELECT media_kind FROM media_assets WHERE id = ?")
        .get(id).media_kind,
      "video",
    );
  } finally {
    f.sqlite.close();
  }
});

test("images still use compression; unsupported videos and category videos are rejected before storage", async () => {
  const f = uploadFixture();
  try {
    assert.equal(
      (
        await f.upload(
          "image",
          new File(["image"], "rug.png", { type: "image/png" }),
        )
      ).status,
      201,
    );
    assert.equal(f.compressed(), 1);
    assert.match(f.writes[0].key, /\.webp$/);
    assert.equal(f.writes[0].options.httpMetadata.contentType, "image/webp");
    assert.equal(
      (
        await f.upload(
          "video",
          new File(["video"], "hero.mov", { type: "video/quicktime" }),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await f.upload(
          "video",
          new File(["video"], "hero.mp4", { type: "video/mp4" }),
          "category-heritage",
        )
      ).status,
      400,
    );
    assert.equal(f.writes.length, 1);
    f.deny();
    assert.equal(
      (
        await f.upload(
          "video",
          new File(["video"], "hero.mp4", { type: "video/mp4" }),
        )
      ).status,
      401,
    );
  } finally {
    f.sqlite.close();
  }
});
