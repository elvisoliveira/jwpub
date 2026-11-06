// crypto.rs — compiled to crypto.wasm by build.sh, with the key read from the JWPUB_KEY
// environment variable (a GitHub Secret in the Pages workflow) at compile time.
// Holds the secret key and derives the AES key+iv by XORing it with the sha256.
#![no_std]

static SECRET: [u8; 32] = decode(env!("JWPUB_KEY"));

// JWPUB_KEY (64 hex digits) → 32 bytes, at compile time; a bad key fails the build.
const fn decode(s: &str) -> [u8; 32] {
    let b = s.as_bytes();
    assert!(b.len() == 64, "JWPUB_KEY: expected 64 hex digits");
    let mut out = [0u8; 32];
    let mut i = 0;
    while i < 32 {
        out[i] = (nibble(b[2 * i]) << 4) | nibble(b[2 * i + 1]);
        i += 1;
    }
    out
}

const fn nibble(c: u8) -> u8 {
    match c {
        b'0'..=b'9' => c - b'0',
        b'a'..=b'f' => c - b'a' + 10,
        b'A'..=b'F' => c - b'A' + 10,
        _ => panic!("JWPUB_KEY: not a hex digit"),
    }
}

static mut IN: [u8; 32] = [0; 32];
static mut OUT: [u8; 32] = [0; 32];

#[no_mangle]
pub extern "C" fn in_ptr() -> *mut u8 { &raw mut IN as *mut u8 }

#[no_mangle]
pub extern "C" fn out_ptr() -> *const u8 { &raw const OUT as *const u8 }

#[no_mangle]
pub extern "C" fn xor32() {
    for i in 0..32 {
        unsafe { OUT[i] = IN[i] ^ SECRET[i]; }
    }
}

#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! { loop {} }
