// crypto.template.rs — compiled to crypto.wasm by the Pages workflow.
// __SECRET_BYTES__ is filled from the JWPUB_KEY GitHub Secret at build time.
// Holds the secret key and derives the AES key+iv by XORing it with the sha256.
#![no_std]

static SECRET: [u8; 32] = [__SECRET_BYTES__];

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
