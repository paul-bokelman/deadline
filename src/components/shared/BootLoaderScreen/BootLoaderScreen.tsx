import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { gameEventBus } from '@/game/events';
import { Z_INDEX_TIERS } from '@/system/zIndex';
import { playStartupSfx } from '@/utils/audio/osSfx';

const BOOT_DURATION_MS = 3000;
const DEFAULT_PRE_FADE_MS = 0;
const DEFAULT_POST_FADE_MS = 850;
const MAX_VISIBLE_LINES = 34;

interface BootLine {
  prefix: string;
  text: string;
  isError?: boolean;
}

const BOOT_LINES: BootLine[] = [
  { prefix: 'BL1', text: 'Boot Loader Version 1.10 for RZV2MA' },
  { prefix: 'BL1', text: 'Build: r01.10.04-secure-boot-2026.04.19' },
  { prefix: 'BL1', text: 'Silicon ID: 0x8472A90C, lot A6K-14, wafer 09' },
  {
    prefix: 'BL1',
    text: 'Cold reset source: WDT_SYS0 + RTC domain brownout latch',
  },
  {
    prefix: 'BL1',
    text: 'Boot mode strap pins: MD[3:0]=0010, secure monitor enabled',
  },
  { prefix: 'BL1', text: 'CPU0: ARM Cortex-A55 @ 1.20GHz, rev r2p0' },
  { prefix: 'BL1', text: 'CPU1: ARM Cortex-A55 @ 1.20GHz, rev r2p0 parked' },
  { prefix: 'BL1', text: 'CPU2: ARM Cortex-A55 @ 1.20GHz, rev r2p0 parked' },
  { prefix: 'BL1', text: 'CPU3: ARM Cortex-A55 @ 1.20GHz, rev r2p0 parked' },
  { prefix: 'BL1', text: 'GICv3 distributor detected, redistributors 4' },
  { prefix: 'BL1', text: 'L2 cache: 512 KiB unified, ECC scrub requested' },
  { prefix: 'BL1', text: 'TZC-400: region 0 secure SRAM locked' },
  { prefix: 'BL1', text: 'TZC-400: region 1 non-secure DDR aperture pending' },
  { prefix: 'BL1', text: 'PMIC: DA9062 page 0 status 0x34, VDD_CORE 0.890V' },
  { prefix: 'BL1', text: 'PMIC: rail VDD_DDR 1.100V stable after 4.8ms' },
  { prefix: 'BL1', text: 'OTP shadow registers loaded [32/32]' },
  { prefix: 'BL1', text: 'OTP anti-rollback fuse index: 00000007' },
  { prefix: 'BL1', text: 'TRNG entropy pool warm-up: 4096 bits accepted' },
  { prefix: 'BL1', text: 'ROM API version 0x00030412' },
  { prefix: 'BL1', text: 'Relocating vector table to 0x0002F000' },
  { prefix: 'BL1', text: 'Wakeup secondary core...' },
  { prefix: 'BL1', text: 'Migration secondary core to WFE status' },
  { prefix: 'BL1', text: 'Secondary core mailbox base 0xE6180000' },
  { prefix: 'BL1', text: 'Watchdog SYS0 armed: 8000ms, window disabled' },
  { prefix: 'BL1', text: 'I-cache enabled, branch predictor enabled' },
  { prefix: 'BL1', text: 'D-cache disabled for boot media staging' },
  { prefix: 'BL1', text: 'SCIF clock = 66.66 MHz' },
  { prefix: 'BL1', text: 'SCIF0 console initialized: 115200,8,n,1' },
  { prefix: 'BL1', text: 'Clock generator PLL0 lock [OK] 1200MHz' },
  { prefix: 'BL1', text: 'Clock generator PLL1 lock [OK] 533MHz' },
  { prefix: 'BL1', text: 'Clock generator PLL2 lock [OK] 400MHz' },
  { prefix: 'BL1', text: 'Reset controller deassert: SDHI0 SDHI1 USB3 PCIE' },
  { prefix: 'BL1', text: 'Pinmux profile: corporate-terminal-revC' },
  { prefix: 'BL1', text: 'GPIO expander 0x20 probe [OK]' },
  { prefix: 'BL1', text: 'GPIO expander 0x21 probe [OK]' },
  { prefix: 'BL1', text: 'I2C0 bus recovery pulses: 9' },
  { prefix: 'BL1', text: 'I2C1 bus speed set to 400kHz' },
  { prefix: 'BL1', text: 'SPI flash JEDEC id: EF 40 18, 16MiB' },
  { prefix: 'BL1', text: 'SPI flash protected ranges: 0x000000-0x03FFFF' },
  { prefix: 'BL1', text: 'SDHI clock calibration tap=0x17 phase=0x03' },
  { prefix: 'BL1', text: 'eMMC initialized (HS400, 200MHz, bus width 8)' },
  { prefix: 'BL1', text: 'eMMC CID: 150100445836384D4203F1ACCA8800E7' },
  { prefix: 'BL1', text: 'eMMC EXT_CSD rev 1.8, cache 1024 KiB enabled' },
  { prefix: 'BL1', text: 'RPMB key provisioned: yes, write counter 0000318A' },
  { prefix: 'BL1', text: 'Boot partition select: mmcblk0boot0' },
  { prefix: 'BL1', text: 'Reading partition table from mmcblk0...' },
  { prefix: 'BL1', text: 'GPT header CRC32 0x6C03AC11 [OK]' },
  {
    prefix: 'BL1',
    text: 'Partition 00: bootparam_a  offset 0x00000800 size 0x00000400',
  },
  {
    prefix: 'BL1',
    text: 'Partition 01: bootparam_b  offset 0x00000C00 size 0x00000400',
  },
  {
    prefix: 'BL1',
    text: 'Partition 02: loader_a     offset 0x00001000 size 0x00080000',
  },
  {
    prefix: 'BL1',
    text: 'Partition 03: loader_b     offset 0x00081000 size 0x00080000',
  },
  {
    prefix: 'BL1',
    text: 'Partition 04: u-boot_a     offset 0x00140000 size 0x00200000',
  },
  {
    prefix: 'BL1',
    text: 'Partition 05: u-boot_b     offset 0x00340000 size 0x00200000',
  },
  {
    prefix: 'BL1',
    text: 'Partition 06: env          offset 0x00540000 size 0x00020000',
  },
  {
    prefix: 'BL1',
    text: 'A/B slot metadata: active=A, retry_count=1, successful=0',
  },
  { prefix: 'BL1', text: 'Loaded the boot parameter for 2nd boot' },
  { prefix: 'BL1', text: 'bootparam_a magic 0x42504152 version 3' },
  { prefix: 'BL1', text: 'bootparam_a nonce 8C:62:19:A4:31:E9:00:7D' },
  { prefix: 'BL1', text: 'bootparam_a monotonic counter accepted' },
  { prefix: 'BL1', text: 'Loaded the boot parameter for U-Boot' },
  { prefix: 'BL1', text: 'u-boot_a header magic 0x27051956 arch AARCH64' },
  { prefix: 'BL1', text: 'u-boot_a load address 0x50000000 entry 0x50000000' },
  { prefix: 'BL1', text: 'u-boot_a image timestamp 2026-04-26 03:21:44 UTC' },
  { prefix: 'BL1', text: 'u-boot_a declared payload length 0x001C82A0' },
  { prefix: 'BL1', text: 'Certificate chain root hash: 73D9:4B21:0C8E:AA10' },
  { prefix: 'BL1', text: 'Certificate CN: DEADLINE_CORP_DEVICE_AUTHORITY' },
  { prefix: 'BL1', text: 'Certificate policy: PROD_BOOT_CHAIN_RZV2MA' },
  { prefix: 'BL1', text: 'Verified signature: SHA256/RSA-2048 [OK]' },
  { prefix: 'BL1', text: 'Decrypting stage payload: AES-256-XTS sector tweak' },
  { prefix: 'BL1', text: 'Decryption page 0000/0128 [OK]' },
  { prefix: 'BL1', text: 'Decryption page 0032/0128 [OK]' },
  { prefix: 'BL1', text: 'Decryption page 0064/0128 [OK]' },
  { prefix: 'BL1', text: 'Decryption page 0096/0128 [OK]' },
  { prefix: 'BL1', text: 'Decryption page 0128/0128 [OK]' },
  { prefix: 'BL1', text: 'Relocation records applied: 412' },
  { prefix: 'BL1', text: 'Zeroing BSS region 0x4401E400-0x44024C00' },
  { prefix: 'BL1', text: 'MMU table L0 created at 0x00030000' },
  { prefix: 'BL1', text: 'MMU table L1 device map installed' },
  { prefix: 'BL1', text: 'EL3 runtime services registered' },
  { prefix: 'BL1', text: 'SDEI dispatcher disabled by platform policy' },
  { prefix: 'BL1', text: 'Measured boot digest extended to PCR[0]' },
  { prefix: 'BL1', text: 'Measured boot event: BL2_IMAGE SHA256=E7B1...4D29' },
  { prefix: 'BL1', text: 'Loaded the 2nd boot loader (size=0x0001E400)' },
  { prefix: 'BL1', text: 'BL2 stack top 0x4403FFF0, heap 0x44025000' },
  { prefix: 'BL1', text: 'Hand-off control to 2nd boot loader @ 0x44000000' },
  { prefix: 'BL1', text: 'the 2nd bootloader start' },
  { prefix: 'BL2', text: '2nd boot loader entered_for RZV2MA' },
  { prefix: 'BL2', text: 'BL2 console rebind: SCIF0 secure owner' },
  { prefix: 'BL2', text: 'Platform security state: SECURE' },
  { prefix: 'BL2', text: 'R-Car compatible clock tree imported' },
  { prefix: 'BL2', text: 'DDR PHY firmware revision 0x0008120F' },
  { prefix: 'BL2', text: 'DDR VREF training seed 0x4C89D331' },
  { prefix: 'BL2', text: 'DRAM frequency negotiation: target 1600MT/s' },
  { prefix: 'BL2', text: 'DRAM topology: 2 ranks, 16-bit, 4096 MiB' },
  { prefix: 'BL2', text: 'DRAM timing tCL=22 tRCD=22 tRP=22 tRAS=52' },
  { prefix: 'BL2', text: 'DRAM ZQ calibration started' },
  { prefix: 'BL2', text: 'DRAM ZQ calibration code PU=0x27 PD=0x24' },
  { prefix: 'BL2', text: 'PHY training pass 1/3 ... done' },
  { prefix: 'BL2', text: 'PHY lane 0 write leveling delay 0x11' },
  { prefix: 'BL2', text: 'PHY lane 1 write leveling delay 0x13' },
  { prefix: 'BL2', text: 'PHY lane 2 write leveling delay 0x10' },
  { prefix: 'BL2', text: 'PHY lane 3 write leveling delay 0x12' },
  { prefix: 'BL2', text: 'PHY training pass 2/3 ... done' },
  {
    prefix: 'BL2',
    text: 'Read eye margin lane0: left=41 right=39 center=0x6A',
  },
  {
    prefix: 'BL2',
    text: 'Read eye margin lane1: left=37 right=42 center=0x68',
  },
  {
    prefix: 'BL2',
    text: 'Read eye margin lane2: left=40 right=40 center=0x69',
  },
  {
    prefix: 'BL2',
    text: 'Read eye margin lane3: left=38 right=41 center=0x67',
  },
  { prefix: 'BL2', text: 'PHY training pass 3/3 ... done' },
  {
    prefix: 'BL2',
    text: 'Write eye margin lane0: left=34 right=36 center=0x72',
  },
  {
    prefix: 'BL2',
    text: 'Write eye margin lane1: left=35 right=35 center=0x71',
  },
  {
    prefix: 'BL2',
    text: 'Write eye margin lane2: left=33 right=38 center=0x73',
  },
  {
    prefix: 'BL2',
    text: 'Write eye margin lane3: left=36 right=34 center=0x70',
  },
  { prefix: 'BL2', text: 'DDR initialization completed_A' },
  {
    prefix: 'BL2',
    text: 'DDR controller: ECC scrub start 0x40000000 length 0x01000000',
  },
  { prefix: 'BL2', text: 'DDR controller: ECC scrub progress 25%' },
  { prefix: 'BL2', text: 'DDR controller: ECC scrub progress 50%' },
  { prefix: 'BL2', text: 'DDR controller: ECC scrub progress 75%' },
  { prefix: 'BL2', text: 'DDR controller: ECC scrub progress 100%' },
  { prefix: 'BL2', text: 'DDR self-test region 0x40000000-0x80000000 ... OK' },
  { prefix: 'BL2', text: 'Walking ones test bank0 row0 col0 ... OK' },
  { prefix: 'BL2', text: 'Walking zeros test bank0 row0 col0 ... OK' },
  {
    prefix: 'BL2',
    text: 'March C- sample window 0x40000000-0x400FFFFF ... OK',
  },
  { prefix: 'BL2', text: 'Address bus inversion test ... OK' },
  { prefix: 'BL2', text: 'Coherent interconnect CCI-500 enabled' },
  { prefix: 'BL2', text: 'SMMU stream table base 0x43F00000' },
  { prefix: 'BL2', text: 'USB3 PHY reset released' },
  { prefix: 'BL2', text: 'PCIe PHY PLL lock [OK]' },
  { prefix: 'BL2', text: 'Ethernet MAC address source: OTP' },
  { prefix: 'BL2', text: 'Ethernet MAC0 02:17:8B:43:91:C0' },
  {
    prefix: 'BL2',
    text: 'Frame buffer handoff disabled: headless recovery mode',
  },
  { prefix: 'BL2', text: 'Thermal zone cpu-thermal: 42.8C' },
  { prefix: 'BL2', text: 'Thermal trip critical: 105.0C' },
  { prefix: 'BL2', text: 'Loading secure monitor BL31 from loader capsule' },
  { prefix: 'BL2', text: 'Initializing TF-A BL31 services' },
  { prefix: 'BL2', text: 'BL31 version: v2.10.0-rzv2ma-deadline.7' },
  { prefix: 'BL2', text: 'SMCCC_ARCH_FEATURES: SVE disabled' },
  { prefix: 'BL2', text: 'SMCCC_ARCH_WORKAROUND_1: required' },
  { prefix: 'BL2', text: 'SMCCC_ARCH_WORKAROUND_2: not required' },
  { prefix: 'BL2', text: 'PSCI: SYSTEM_RESET registered' },
  { prefix: 'BL2', text: 'PSCI: CPU_ON registered' },
  { prefix: 'BL2', text: 'PSCI: SYSTEM_SUSPEND unavailable' },
  { prefix: 'BL2', text: 'Secure payload dispatcher: none' },
  { prefix: 'BL2', text: 'Non-secure entry point prepared @ 0x50000000' },
  { prefix: 'BL2', text: 'Flushing dcache range 0x50000000-0x501C82A0' },
  { prefix: 'BL2', text: 'Invalidating icache all levels' },
  { prefix: 'BL2', text: 'Reading rollback index for U-Boot: 00000008' },
  { prefix: 'BL2', text: 'Rollback index accepted against fuse 00000007' },
  { prefix: 'BL2', text: 'Loading U-Boot image from eMMC offset 0x140000' },
  { prefix: 'BL2', text: 'Read block group 00000000-0000007F ... OK' },
  { prefix: 'BL2', text: 'Read block group 00000080-000000FF ... OK' },
  { prefix: 'BL2', text: 'Read block group 00000100-0000017F ... OK' },
  { prefix: 'BL2', text: 'Read block group 00000180-000001FF ... OK' },
  { prefix: 'BL2', text: 'Read block group 00000200-0000027F ... OK' },
  { prefix: 'BL2', text: 'Read block group 00000280-000002FF ... OK' },
  { prefix: 'BL2', text: 'Read block group 00000300-0000037F ... OK' },
  { prefix: 'BL2', text: 'Read block group 00000380-000003FF ... OK' },
  { prefix: 'BL2', text: 'Parsing FIT image /images/uboot' },
  { prefix: 'BL2', text: 'FIT config: conf-rzv2ma-corp-terminal.dtb' },
  { prefix: 'BL2', text: 'Hash node sha256: verified' },
  {
    prefix: 'BL2',
    text: 'FDT node /memory reg = <0x0 0x40000000 0x0 0x80000000>',
  },
  { prefix: 'BL2', text: 'FDT chosen stdout-path = serial0:115200n8' },
  { prefix: 'BL2', text: 'FDT reserved-memory: optee@43e00000 skipped' },
  {
    prefix: 'BL2',
    text: 'Environment sector redundant copy selected: primary',
  },
  { prefix: 'BL2', text: 'env: bootdelay=0' },
  { prefix: 'BL2', text: 'env: verify=yes' },
  { prefix: 'BL2', text: 'env: panic_timeout=0' },
  { prefix: 'BL2', text: 'env: recovery_contact=IT_SUPPORT' },
  { prefix: 'BL2', text: 'env: deadline_mode=urgent' },
  { prefix: 'BL2', text: 'env: last_known_good=slot_b' },
  { prefix: 'BL2', text: 'Loading U-Boot image from eMMC offset 0x140000' },
  {
    prefix: 'BL2',
    text: 'Calculating U-Boot payload checksum over 0x001C82A0 bytes',
  },
  {
    prefix: 'BL2',
    text: 'Checksum window 0x50000000-0x5003FFFF ... 0x29D1B733',
  },
  {
    prefix: 'BL2',
    text: 'Checksum window 0x50040000-0x5007FFFF ... 0xC701991E',
  },
  {
    prefix: 'BL2',
    text: 'Checksum window 0x50080000-0x500BFFFF ... 0x1880AC42',
  },
  {
    prefix: 'BL2',
    text: 'Checksum window 0x500C0000-0x500FFFFF ... 0x7AA41102',
  },
  {
    prefix: 'BL2',
    text: 'Checksum window 0x50100000-0x5013FFFF ... 0xDEAD10AD',
  },
  {
    prefix: 'BL2',
    text: 'Checksum window 0x50140000-0x5017FFFF ... 0x00391B20',
  },
  {
    prefix: 'BL2',
    text: 'Checksum window 0x50180000-0x501C82A0 ... 0x00000000',
  },
  {
    prefix: 'BL2',
    text: 'Header checksum: stored 0x9F32A1C4, calculated 0x00000000',
  },
  {
    prefix: 'BL2',
    text: 'Slot A validation failed, decrementing retry counter',
  },
  {
    prefix: 'BL2',
    text: 'Attempting fallback policy: slot_b allowed=0 reason=rollback',
  },
  {
    prefix: 'BL2',
    text: 'Recovery vector not armed; console intervention disabled',
  },
  {
    prefix: 'BL2',
    text: '[Error] sum_check() for U-Boot',
    isError: true,
  },
  {
    prefix: 'BL2',
    text: '[Error] CRC32 mismatch: expected 0x9F32A1C4 got 0x00000000',
    isError: true,
  },
  {
    prefix: 'BL2',
    text: '[Error] slot_a retry counter exhausted',
    isError: true,
  },
  {
    prefix: 'BL2',
    text: '[Error] slot_b rejected by anti-rollback index',
    isError: true,
  },
  {
    prefix: 'BL2',
    text: '[Error] secure handoff aborted before non-secure world entry',
    isError: true,
  },
  {
    prefix: 'BL2',
    text: '[Error] 2nd loader is failed',
    isError: true,
  },
];

const containerStyle: JSX.CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: 'var(--app-width, 100vw)',
  height: 'var(--app-height, 100vh)',
  backgroundColor: '#000000',
  color: '#d8d8d8',
  fontFamily: '"VT323", "Courier New", "Lucida Console", Consolas, monospace',
  fontSize: '17px',
  lineHeight: 1.25,
  padding: '14px 18px',
  // Bootloader must visually sit above *all* windows and overlays.
  zIndex: Z_INDEX_TIERS.bootLoader,
  overflow: 'hidden',
  whiteSpace: 'pre',
  letterSpacing: '0.3px',
  userSelect: 'none',
  cursor: 'default',
  textShadow: '0 0 1px rgba(255,255,255,0.25)',
};

const errorStyle: JSX.CSSProperties = {
  color: '#ff5a5a',
};

const cursorStyle: JSX.CSSProperties = {
  display: 'inline-block',
  width: '10px',
  height: '17px',
  backgroundColor: '#d8d8d8',
  verticalAlign: 'text-bottom',
  marginLeft: '2px',
};

interface BootLoaderListener {
  (options?: TriggerBootLoaderOptions): void;
}

const listeners = new Set<BootLoaderListener>();
interface TriggerBootLoaderOptions {
  bootDurationMs?: number;
  preFadeMs?: number;
  postFadeMs?: number;
}

/**
 * Imperatively show the boot loader screen for ~4 seconds.
 * Safe to call from anywhere; resolves after the screen hides.
 */
export const triggerBootLoaderScreen = (
  options?: TriggerBootLoaderOptions
): Promise<void> => {
  const preFadeMs = options?.preFadeMs ?? DEFAULT_PRE_FADE_MS;
  const bootDurationMs = options?.bootDurationMs ?? BOOT_DURATION_MS;
  const postFadeMs = options?.postFadeMs ?? DEFAULT_POST_FADE_MS;
  const totalDurationMs = preFadeMs + bootDurationMs + postFadeMs;

  return new Promise((resolve) => {
    gameEventBus.emit('bootloader:started', { at: Date.now() });
    listeners.forEach((listener) => listener(options));
    window.setTimeout(() => {
      gameEventBus.emit('bootloader:ended', { at: Date.now() });
      resolve();
    }, totalDurationMs);
  });
};

const BootLoaderScreen: FunctionComponent = () => {
  const [isActive, setIsActive] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const tokenRef = useRef(0);
  const fadeDurationMsRef = useRef(0);

  useEffect(() => {
    const handleTrigger = (options?: TriggerBootLoaderOptions): void => {
      tokenRef.current += 1;
      const myToken = tokenRef.current;
      const preFadeMs = options?.preFadeMs ?? DEFAULT_PRE_FADE_MS;
      const bootDurationMs = options?.bootDurationMs ?? BOOT_DURATION_MS;
      const postFadeMs = options?.postFadeMs ?? DEFAULT_POST_FADE_MS;

      // Pre-boot phase should be an immediate cut to black.
      fadeDurationMsRef.current = 0;

      setIsOverlayVisible(true);
      setOverlayOpacity(1);
      setVisibleCount(0);

      const totalLines = BOOT_LINES.length;
      const stepMs = Math.max(
        10,
        Math.floor((bootDurationMs - 250) / totalLines)
      );
      const startBootSequence = () => {
        if (tokenRef.current !== myToken) return;
        setIsActive(true);
        const intervalId = window.setInterval(() => {
          if (tokenRef.current !== myToken) {
            window.clearInterval(intervalId);
            return;
          }
          setVisibleCount((current) => {
            if (current >= totalLines) {
              window.clearInterval(intervalId);
              return current;
            }
            return Math.min(totalLines, current + 2);
          });
        }, stepMs);

        window.setTimeout(() => {
          if (tokenRef.current !== myToken) {
            window.clearInterval(intervalId);
            return;
          }
          setIsActive(false);
          let hasSettledStartupFlow = false;
          let startupRetryTimeoutId: number | null = null;
          let resumeStartupFromInteraction = (): void => undefined;

          const clearStartupInteractionRetries = () => {
            window.removeEventListener(
              'pointerdown',
              resumeStartupFromInteraction
            );
            window.removeEventListener('keydown', resumeStartupFromInteraction);
            if (startupRetryTimeoutId !== null) {
              window.clearTimeout(startupRetryTimeoutId);
              startupRetryTimeoutId = null;
            }
          };

          const settleStartupFlow = () => {
            if (hasSettledStartupFlow) return;
            hasSettledStartupFlow = true;
            if (tokenRef.current !== myToken) return;
            clearStartupInteractionRetries();
            gameEventBus.emit('startup_sfx:ended', { at: Date.now() });
          };

          const tryPlayStartupAndFinalize = () => {
            void playStartupSfx()
              .then(({ durationMs, didStart }) => {
                if (tokenRef.current !== myToken) return;
                if (!didStart) return;
                clearStartupInteractionRetries();
                window.setTimeout(settleStartupFlow, durationMs);
              })
              .catch(() => {
                if (tokenRef.current !== myToken) return;
                settleStartupFlow();
              });
          };

          tryPlayStartupAndFinalize();

          resumeStartupFromInteraction = () => {
            if (tokenRef.current !== myToken) return;
            tryPlayStartupAndFinalize();
          };

          window.addEventListener('pointerdown', resumeStartupFromInteraction, {
            passive: true,
          });
          window.addEventListener('keydown', resumeStartupFromInteraction, {
            passive: true,
          });

          startupRetryTimeoutId = window.setTimeout(() => {
            clearStartupInteractionRetries();
          }, 10_000);

          fadeDurationMsRef.current = postFadeMs;
          setOverlayOpacity(0);
          window.setTimeout(() => {
            if (tokenRef.current !== myToken) return;
            setIsOverlayVisible(false);
          }, postFadeMs);
          window.clearInterval(intervalId);
        }, bootDurationMs);
      };

      if (preFadeMs <= 0) {
        startBootSequence();
        return;
      }
      window.setTimeout(startBootSequence, preFadeMs);
    };

    listeners.add(handleTrigger);
    return () => {
      listeners.delete(handleTrigger);
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const intervalId = window.setInterval(() => {
      setShowCursor((current) => !current);
    }, 480);
    return () => window.clearInterval(intervalId);
  }, [isActive]);

  if (!isOverlayVisible) return null;

  const visibleLines = BOOT_LINES.slice(
    Math.max(0, visibleCount - MAX_VISIBLE_LINES),
    visibleCount
  );

  return (
    <div
      style={{
        ...containerStyle,
        opacity: overlayOpacity,
        transition: `opacity ${fadeDurationMsRef.current}ms linear`,
      }}
    >
      {isActive &&
        visibleLines.map((line, index) => (
          <div key={index} style={line.isError ? errorStyle : undefined}>
            {`[${line.prefix}] ${line.text}`}
          </div>
        ))}
      {isActive && visibleCount > 0 && (
        <span
          style={{
            ...cursorStyle,
            visibility: showCursor ? 'visible' : 'hidden',
          }}
        />
      )}
    </div>
  );
};

export default BootLoaderScreen;
