# Allen & Heath AHM

Controls the [Allen & Heath AHM](https://www.allen-heath.com/ahm-series/) series of audio matrix processors.

## Buttons-compatible 3.0.0 backport

This build keeps the AHM 3.0.0 user-facing numbering while using the older module API supported by Bitfocus Buttons 1.6.x.

- All action inputs, zones, control groups, presets, and playback tracks are **1-based**. Entering `1` always selects the first item.
- Action number fields support expressions, so a position variable containing `1` targets Input 1 or Zone 1 directly.
- Input, zone, control group, and input-to-zone mute actions offer **Set mute state** and **Toggle current state** operations.
- Toggle mode requests the current mute state from the AHM before sending the opposite state. It does not require workflow variables.
- The **Input to Zone - Level Display** feedback shows the current send level in dB and only requests the pairs used on buttons.
- Each Input-to-Zone pair also exposes a normalized `ip_<input>_zn_<zone>_gauge` connection variable for the Buttons **Gauge 1 Value** field. The value ranges from `0` to `1`.
- Module upgrades explicitly preserve existing input, zone, control-group, preset, and playback action assignments.
- **Set Input to Zone Send Level** sets an absolute crosspoint level from `-inf` through `+10 dB`, then refreshes the level display and gauge.

### Existing 2.3.1 actions

AHM 2.3.1 stored action dropdown values as zero-based identifiers. After switching an existing connection to this build, review and re-save existing channel selections so their displayed 1-based value is used.
