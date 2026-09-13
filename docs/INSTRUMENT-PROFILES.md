# Instrument Profiles

## GRAND_PIANO — AUDIO-01A

The default browser engine uses the Salamander Grand Piano V3 sample collection through a version-pinned manifest. The repository does not commit the sample binaries. The manifest maps MIDI 21–108 to 30 recorded roots and permits at most two semitones of nearest-root transposition.

Source revision: `Tonejs/audio@efd8296360f9526e379bfbe5c1698ff54d6a1d34`.
Sample subtree checksum (Git tree SHA-1): `7c0b28ee349569d013cb98fbfb36d035a3f32fa3`.
License: CC BY 3.0. Attribution: Salamander Grand Piano V3 by Alexander Holm.

## CLASSICAL_GUITAR — AUDIO-02

The default browser engine also includes the FreePats Spanish Classical Guitar profile, a recorded nylon-string instrument. The bounded profile covers MIDI 40–84 with at most one semitone of transposition, following the published SFZ mapping.

Source revision: `freepats/spanish-classical-guitar@6f4eb1b092acc88f5448cea1a0001bd07b971af8`.
Sample subtree checksum (Git tree SHA-1): `a9df2a7770264bc71f7f46d8dfba9d046edd9c43`.
License: CC0 1.0.

`stringNumber` and `fret` remain optional request evidence. This profile currently resolves by canonical pitch only; it never guesses string/fret from screen geometry. A future string-aware collection may use those fields only when exact canonical TAB evidence exists.

Hosts may override either sample base URL to use a controlled CDN/artifact store while preserving the manifest and provenance contract.
