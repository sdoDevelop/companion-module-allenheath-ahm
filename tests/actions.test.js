import test from 'node:test'
import assert from 'node:assert/strict'
import { getActions } from '../actions.js'
import * as Constants from '../constants.js'

function createContext({ channelMute = false, sendMute = false } = {}) {
	const sent = []
	const sendState = []
	const levelRequests = []
	const context = {
		numberOfInputs: 16,
		numberOfZones: 16,
		numberOfControlGroups: 16,
		inputsMute: new Array(16).fill(0),
		zonesMute: new Array(16).fill(0),
		controlgroupsMute: new Array(16).fill(0),
		inputsToZonesMute: [],
		sendCommand: (buffers) => sent.push(...buffers),
		checkFeedbacks: () => {},
		sleep: async () => {},
		log: () => {},
		waitForChannelMute: async () => channelMute,
		requestMuteInfo: () => {},
		waitForSendMute: async () => sendMute,
		requestSendMuteInfo: () => {},
		updateSendMuteState: (...args) => sendState.push(args),
		requestSendLevelInfo: (...args) => levelRequests.push(args),
	}

	return { context, actions: getActions.bind(context)(), sent, sendState, levelRequests }
}

test('action number fields are 1-based number inputs', () => {
	const { actions } = createContext()
	const inputOption = actions.mute_input.options.find((option) => option.id === 'mute_number')
	const zoneOption = actions.input_to_zone.options.find((option) => option.id === 'number')

	assert.deepEqual(
		{ type: inputOption.type, default: inputOption.default, min: inputOption.min, max: inputOption.max },
		{ type: 'number', default: 1, min: 1, max: 16 },
	)
	assert.deepEqual(
		{ type: zoneOption.type, default: zoneOption.default, min: zoneOption.min, max: zoneOption.max },
		{ type: 'number', default: 1, min: 1, max: 16 },
	)
})

test('Input 1 maps to AHM channel byte 0', async () => {
	const { context, actions, sent } = createContext()

	await actions.mute_input.callback({ options: { mute_number: 1, mute: true } })

	assert.deepEqual([...sent[0]], [0x90, 0x00, 0x7f, 0x90, 0x00, 0x00])
	assert.equal(context.inputsMute[0], 1)
})

test('toggle requests live Input 1 state and sends the inverse', async () => {
	const { actions, sent } = createContext({ channelMute: true })

	await actions.mute_input.callback({
		options: { mute_number: 1, operation: 'toggle', mute: true },
	})

	assert.deepEqual([...sent[0]], [0x90, 0x00, 0x3f, 0x90, 0x00, 0x00])
})

test('Input 1 to Zone 16 uses zero-based protocol bytes but 1-based state keys', async () => {
	const { actions, sent, sendState } = createContext({ sendMute: false })

	await actions.input_to_zone.callback({
		options: { mute_number: 1, number: 16, operation: 'toggle', mute: false },
	})

	assert.equal(sent[0][10], 0)
	assert.equal(sent[0][12], 15)
	assert.equal(sent[0][13], 0x7f)
	assert.deepEqual(sendState[0], [Constants.SendType.InputToZone, 1, 16, 1])
})

test('Zone 1, Control Group 1, and 1-to-1 send levels map to protocol byte 0', async () => {
	const { actions, sent } = createContext()

	await actions.mute_zone.callback({ options: { mute_number: 1, mute: true } })
	await actions.mute_controlgroup.callback({ options: { mute_number: 1, mute: true } })
	await actions.inc_dec_in_zn_send_level.callback({
		options: { incdec_ch_number: 1, number: 1, incdec: 'inc' },
	})

	assert.deepEqual([...sent[0]], [0x91, 0x00, 0x7f, 0x91, 0x00, 0x00])
	assert.deepEqual([...sent[1]], [0x92, 0x00, 0x7f, 0x92, 0x00, 0x00])
	assert.equal(sent[2][10], 0)
	assert.equal(sent[2][12], 0)
})

test('Input 1 level actions use AHM channel byte 0', async () => {
	const { actions, sent } = createContext()

	await actions.set_level_input.callback({ options: { setlvl_ch_number: 1, level: 105 } })

	assert.equal(sent[0][2], 0)
	assert.equal(sent[1][12], 0)
})

test('absolute Input-to-Zone level uses 1-based options, the documented SysEx command, and refreshes state', async () => {
	const { actions, sent, levelRequests } = createContext()
	const inputOption = actions.set_in_zn_send_level.options.find((option) => option.id === 'input')
	const zoneOption = actions.set_in_zn_send_level.options.find((option) => option.id === 'zone')

	assert.deepEqual(
		{ type: inputOption.type, default: inputOption.default, min: inputOption.min, max: inputOption.max },
		{ type: 'number', default: 1, min: 1, max: 16 },
	)
	assert.deepEqual(
		{ type: zoneOption.type, default: zoneOption.default, min: zoneOption.min, max: zoneOption.max },
		{ type: 'number', default: 1, min: 1, max: 16 },
	)

	await actions.set_in_zn_send_level.callback({ options: { input: 1, zone: 16, level: 105 } })

	assert.deepEqual(
		[...sent[0]],
		[0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x00, 0x02, 0x00, 0x01, 0x0f, 0x69, 0xf7],
	)
	assert.deepEqual(levelRequests, [[Constants.SendType.InputToZone, 1, 16]])
})

test('presets and playback tracks are also 1-based', async () => {
	const { actions, sent } = createContext()

	actions.preset_recall.callback({ options: { number: 1 } })
	actions.preset_recall.callback({ options: { number: 129 } })
	actions.playback_track.callback({ options: { number: 1, playbackChannel: 0 } })

	assert.deepEqual([...sent[0]], [0xb0, 0x00, 0x00, 0xc0, 0x00])
	assert.deepEqual([...sent[1]], [0xb0, 0x00, 0x01, 0xc0, 0x00])
	assert.equal(sent[2][11], 0)
})
