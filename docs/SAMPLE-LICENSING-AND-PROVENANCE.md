# Sample Licensing and Provenance

Production sample assets must not enter the repository without explicit redistribution rights and machine-readable provenance. Each instrument manifest records source, author/publisher, license identifier/reference, attribution, redistribution status, pinned source revision and a content/source checksum.

## Salamander Grand Piano

AUDIO-01A uses Salamander Grand Piano V3 by Alexander Holm under CC BY 3.0. Runtime sample URLs are pinned to `Tonejs/audio@efd8296360f9526e379bfbe5c1698ff54d6a1d34`; the `salamander` subtree Git SHA-1 is `7c0b28ee349569d013cb98fbfb36d035a3f32fa3`. The repository stores only the manifest, not the audio binaries. Product distribution must preserve the required attribution.

## FreePats Spanish Classical Guitar

AUDIO-02 uses the FreePats Spanish Classical Guitar collection under CC0 1.0. Runtime sample URLs are pinned to `freepats/spanish-classical-guitar@6f4eb1b092acc88f5448cea1a0001bd07b971af8`; the `samples` subtree Git SHA-1 is `a9df2a7770264bc71f7f46d8dfba9d046edd9c43`. The repository stores only the manifest, not the FLAC binaries.

A host may replace either base URL with its own controlled storage, but must preserve provenance and any applicable license obligations.

## Test assets

Browser tests synthesize tiny WAV data in memory. No third-party binary test sample is committed.
