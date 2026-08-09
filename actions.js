import * as Helpers from './helpers.js'
import * as Constants from './constants.js'

const PRESET_COUNT = 500
const PLAYBACK_COUNT = 127
const MUTE_STATE_TIMEOUT_MS = 1000

const MuteOperation = {
	Set: 'set',
	Toggle: 'toggle',
}

export function getActions() {
	let actions = {}

	this.listOptions = (name, qty) => {
		return [
			{
				type: 'number',
				id: 'number',
				label: name,
				default: 1,
				min: 1,
				max: qty,
				asInteger: true,
			},
		]
	}

	this.muteOptions = (name, qty) => {
		return [
			{
				type: 'number',
				id: 'mute_number',
				label: name,
				default: 1,
				min: 1,
				max: qty,
				asInteger: true,
			},
			{
				type: 'dropdown',
				id: 'operation',
				label: 'Operation',
				default: MuteOperation.Set,
				choices: [
					{ id: MuteOperation.Set, label: 'Set mute state' },
					{ id: MuteOperation.Toggle, label: 'Toggle current state' },
				],
			},
			{
				type: 'checkbox',
				id: 'mute',
				label: 'Mute',
				default: true,
			},
		]
	}

	this.setLevelOptions = (name, qty) => {
		return [
			{
				type: 'number',
				id: 'setlvl_ch_number',
				label: name,
				default: 1,
				min: 1,
				max: qty,
				asInteger: true,
			},
			{
				type: 'dropdown',
				id: 'level',
				label: 'Set Level (dBu)',
				default: '0',
				choices: Helpers.getChoicesArrayOf1DArray(Constants.dbu_Values),
			},
		]
	}

	this.setSendLevelOptions = () => {
		return [
			{
				type: 'number',
				id: 'input',
				label: 'Input',
				default: 1,
				min: 1,
				max: this.numberOfInputs,
				asInteger: true,
			},
			{
				type: 'number',
				id: 'zone',
				label: 'Zone',
				default: 1,
				min: 1,
				max: this.numberOfZones,
				asInteger: true,
			},
			{
				type: 'dropdown',
				id: 'level',
				label: 'Set Level (dB)',
				default: 105,
				choices: Helpers.getChoicesArrayOf1DArray(Constants.dbu_Values),
			},
		]
	}

	this.incDecOptions = (name, qty) => {
		return [
			{
				type: 'number',
				id: 'incdec_ch_number',
				label: name,
				default: 1,
				min: 1,
				max: qty,
				asInteger: true,
			},
			{
				type: 'dropdown',
				id: 'incdec',
				label: 'Increment/Decrement',
				default: 'inc',
				choices: [
					{ id: 'inc', label: 'Increment' },
					{ id: 'dec', label: 'Decrement' },
				],
			},
		]
	}

	this.playbackChannelOptions = (name) => {
		return [
			{
				type: 'dropdown',
				id: 'playbackChannel',
				label: name,
				default: 0,
				choices: Helpers.getChoicesArrayOfKeyValueObject(Constants.PlaybackChannel),
				minChoicesForSearch: 0,
			},
		]
	}

	// action: action of callback
	// type: 0 for input, 1 for zone
	this.setLevelCallback = async (action, type) => {
		if (Helpers.checkIfValueOfEnum(type, Constants.ChannelType) == false) {
			return
		}

		let typeCodeSetLevel = parseInt(0xb0 + type) // type code for Command "Channel Level"
		let typeCodeGetLevel = parseInt(0x00 + type) // type code for Command "Get Channel Level"
		let chNumber = parseInt(action.options.setlvl_ch_number)
		let chIndex = chNumber - 1
		let levelDec = parseInt(action.options.level)

		let buffers = [
			Buffer.from([typeCodeSetLevel, 0x63, chIndex, typeCodeSetLevel, 0x62, 0x17, typeCodeSetLevel, 0x06, levelDec]),
		]
		this.sendCommand(buffers)

		// wait until device has processed first command and then send "Get Channel Level" command so the response triggers the variable to be updated
		await this.sleep(150)
		buffers = [
			Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, typeCodeGetLevel, 0x01, 0x0b, 0x17, chIndex, 0xf7]),
		]
		this.sendCommand(buffers)
	}

	this.incDecLevelCallback = async (action, type) => {
		if (Helpers.checkIfValueOfEnum(type, Constants.ChannelType) == false) {
			return
		}

		let typeCodeSetLevel = parseInt(0xb0 + type) // type code for Command "Level Increment / Decrement"
		let typeCodeGetLevel = parseInt(0x00 + type) // type code for Command "Get Channel Level"
		let chNumber = parseInt(action.options.incdec_ch_number)
		let chIndex = chNumber - 1
		let incdecSelector = action.options.incdec == 'inc' ? 0x7f : 0x3f

		let buffers = [
			Buffer.from([
				typeCodeSetLevel,
				0x63,
				chIndex,
				typeCodeSetLevel,
				0x62,
				0x20,
				typeCodeSetLevel,
				0x06,
				incdecSelector,
			]),
		]
		this.sendCommand(buffers)

		// wait until device has processed first command and then send "Get Channel Level" command so the response triggers the variable to be updated
		await this.sleep(150)
		buffers = [
			Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, typeCodeGetLevel, 0x01, 0x0b, 0x17, chIndex, 0xf7]),
		]
		this.sendCommand(buffers)
	}

	this.incDecSendLevelCallback = async (action, type) => {
		if (Helpers.checkIfValueOfEnum(type, Constants.SendType) == false) {
			return
		}

		let chType = Helpers.getChTypeOfSendType(type)
		let sendChType = Helpers.getSendChTypeOfSendType(type)
		let chNumber = parseInt(action.options.incdec_ch_number)
		let sendChNumber = parseInt(action.options.number)
		let incdecSelector = action.options.incdec == 'inc' ? 0x7f : 0x3f

		let buffers = [
			Buffer.from([
				0xf0,
				0x00,
				0x00,
				0x1a,
				0x50,
				0x12,
				0x01,
				0x00,
				chType,
				0x04,
				chNumber - 1,
				sendChType,
				sendChNumber - 1,
				incdecSelector,
				0xf7,
			]),
		]

		this.sendCommand(buffers)

		if (type === Constants.SendType.InputToZone) {
			await this.sleep(150)
			this.requestSendLevelInfo(type, chNumber, sendChNumber)
		}
	}

	this.setSendLevelCallback = async (action, type) => {
		if (Helpers.checkIfValueOfEnum(type, Constants.SendType) == false) return

		const chType = Helpers.getChTypeOfSendType(type)
		const sendChType = Helpers.getSendChTypeOfSendType(type)
		const inputNumber = parseInt(action.options.input)
		const zoneNumber = parseInt(action.options.zone)
		const level = parseInt(action.options.level)

		this.sendCommand([
			Buffer.from([
				0xf0,
				0x00,
				0x00,
				0x1a,
				0x50,
				0x12,
				0x01,
				0x00,
				chType,
				0x02,
				inputNumber - 1,
				sendChType,
				zoneNumber - 1,
				level,
				0xf7,
			]),
		])

		if (type === Constants.SendType.InputToZone) {
			await this.sleep(150)
			this.requestSendLevelInfo(type, inputNumber, zoneNumber)
		}
	}

	this.resolveMute = async (action, requestCurrentMute, target) => {
		if (action.options.operation !== MuteOperation.Toggle) {
			return action.options.mute
		}

		try {
			return !(await requestCurrentMute())
		} catch (error) {
			this.log('error', `Could not toggle ${target}: ${error.message ?? error}`)
			return undefined
		}
	}

	this.requestCurrentChannelMute = (type, channelNumber) => {
		const pendingMute = this.waitForChannelMute(type, channelNumber, MUTE_STATE_TIMEOUT_MS)
		this.requestMuteInfo(type, channelNumber)
		return pendingMute
	}
	this.requestCurrentSendMute = (inputNumber, zoneNumber) => {
		const pendingMute = this.waitForSendMute(inputNumber, zoneNumber, MUTE_STATE_TIMEOUT_MS)
		this.requestSendMuteInfo(Constants.SendType.InputToZone, inputNumber, zoneNumber)
		return pendingMute
	}

	actions['mute_input'] = {
		name: 'Mute Input',
		options: this.muteOptions('Input', this.numberOfInputs),
		callback: async (action) => {
			const inputNumber = parseInt(action.options.mute_number)
			const inputIndex = inputNumber - 1
			const mute = await this.resolveMute(
				action,
				() => this.requestCurrentChannelMute(Constants.ChannelType.Input, inputNumber),
				`input ${inputNumber}`,
			)
			if (mute === undefined) return

			this.sendCommand([Buffer.from([0x90, inputIndex, mute ? 0x7f : 0x3f, 0x90, inputIndex, 0])])
			this.inputsMute[inputIndex] = mute ? 1 : 0
			this.checkFeedbacks('inputMute')
		},
	}

	actions['mute_zone'] = {
		name: 'Mute Zone',
		options: this.muteOptions('Zone', this.numberOfZones),
		callback: async (action) => {
			const zoneNumber = parseInt(action.options.mute_number)
			const zoneIndex = zoneNumber - 1
			const mute = await this.resolveMute(
				action,
				() => this.requestCurrentChannelMute(Constants.ChannelType.Zone, zoneNumber),
				`zone ${zoneNumber}`,
			)
			if (mute === undefined) return

			this.sendCommand([Buffer.from([0x91, zoneIndex, mute ? 0x7f : 0x3f, 0x91, zoneIndex, 0])])
			this.zonesMute[zoneIndex] = mute ? 1 : 0
			this.checkFeedbacks('zoneMute')
		},
	}

	actions['preset_recall'] = {
		name: 'Recall Preset',
		options: this.listOptions('Preset', PRESET_COUNT),
		callback: (action) => {
			const presetNumber = parseInt(action.options.number)
			const presetIndex = presetNumber - 1
			const buffers = [Buffer.from([0xb0, 0x00, Math.floor(presetIndex / 128), 0xc0, presetIndex % 128])]
			this.sendCommand(buffers)
		},
	}

	actions['playback_track'] = {
		name: 'Playback Track',
		options: this.listOptions('Playback Track', PLAYBACK_COUNT).concat(this.playbackChannelOptions('Playback Channel')),
		callback: (action) => {
			let trackNumber = parseInt(action.options.number)
			let playbackChannel = parseInt(action.options.playbackChannel)

			// console.log(`action playback_track: Got Callback with parameters trackNumber: ${action.options.number} and playbackChannel ${action.options.playbackChannel}.`)

			let buffers = [
				Buffer.from([
					0xf0,
					0x00,
					0x00,
					0x1a,
					0x50,
					0x12,
					0x01,
					0x00,
					0x00,
					0x06,
					playbackChannel,
					trackNumber - 1,
					0xf7,
				]),
			]

			this.sendCommand(buffers)
		},
	}

	actions['input_to_zone'] = {
		name: 'Mute Input to Zone',
		options: this.muteOptions('Input', this.numberOfInputs).concat(this.listOptions('Zone', this.numberOfZones)),
		callback: async (action) => {
			const inputNumber = parseInt(action.options.mute_number)
			const zoneNumber = parseInt(action.options.number)
			const mute = await this.resolveMute(
				action,
				() => this.requestCurrentSendMute(inputNumber, zoneNumber),
				`input ${inputNumber} to zone ${zoneNumber}`,
			)
			if (mute === undefined) return

			this.sendCommand([
				Buffer.from([
					0xf0,
					0x00,
					0x00,
					0x1a,
					0x50,
					0x12,
					0x01,
					0x00,
					0x00,
					0x03,
					inputNumber - 1,
					0x01,
					zoneNumber - 1,
					mute ? 0x7f : 0x3f,
					0xf7,
				]),
			])

			this.updateSendMuteState(Constants.SendType.InputToZone, inputNumber, zoneNumber, mute ? 1 : 0)
			this.checkFeedbacks('inputToZoneMute')
		},
	}

	actions['set_level_input'] = {
		name: 'Set Level of Input',
		options: this.setLevelOptions('Input', this.numberOfInputs),
		callback: async (action) => {
			this.setLevelCallback(action, Constants.ChannelType.Input)
		},
	}

	actions['inc_dec_level_input'] = {
		name: 'Increment/Decrement Level of Input',
		options: this.incDecOptions('Input', this.numberOfInputs),
		callback: async (action) => {
			this.incDecLevelCallback(action, Constants.ChannelType.Input)
		},
	}

	actions['set_level_zone'] = {
		name: 'Set Level of Zone',
		options: this.setLevelOptions('Zone', this.numberOfZones),
		callback: async (action) => {
			this.setLevelCallback(action, Constants.ChannelType.Zone)
		},
	}

	actions['inc_dec_level_zone'] = {
		name: 'Increment/Decrement Level of Zone',
		options: this.incDecOptions('Zone', this.numberOfZones),
		callback: async (action) => {
			this.incDecLevelCallback(action, Constants.ChannelType.Zone)
		},
	}

	actions['inc_dec_in_zn_send_level'] = {
		name: 'Increment/Decrement Input to Zone Send Level',
		options: this.incDecOptions('Input', this.numberOfInputs).concat(this.listOptions('Zone', this.numberOfZones)),
		callback: async (action) => {
			this.incDecSendLevelCallback(action, Constants.SendType.InputToZone)
		},
	}

	actions['set_in_zn_send_level'] = {
		name: 'Set Input to Zone Send Level',
		options: this.setSendLevelOptions(),
		callback: async (action) => {
			await this.setSendLevelCallback(action, Constants.SendType.InputToZone)
		},
	}

	actions['inc_dec_zn_zn_send_level'] = {
		name: 'Increment/Decrement Zone to Zone Send Level',
		options: this.incDecOptions('Zone', this.numberOfZones).concat(this.listOptions('Zone', this.numberOfZones)),
		callback: async (action) => {
			this.incDecSendLevelCallback(action, Constants.SendType.ZoneToZone)
		},
	}

	// Control Group actions
	actions['set_level_controlgroup'] = {
		name: 'Set Level of Control Group',
		options: this.setLevelOptions('Control Group', this.numberOfControlGroups),
		callback: async (action) => {
			this.setLevelCallback(action, Constants.ChannelType.ControlGroup)
		},
	}

	actions['inc_dec_level_controlgroup'] = {
		name: 'Increment/Decrement Level of Control Group',
		options: this.incDecOptions('Control Group', this.numberOfControlGroups),
		callback: async (action) => {
			this.incDecLevelCallback(action, Constants.ChannelType.ControlGroup)
		},
	}

	actions['mute_controlgroup'] = {
		name: 'Mute Control Group',
		options: this.muteOptions('Control Group', this.numberOfControlGroups),
		callback: async (action) => {
			const cgNumber = parseInt(action.options.mute_number)
			const cgIndex = cgNumber - 1
			const mute = await this.resolveMute(
				action,
				() => this.requestCurrentChannelMute(Constants.ChannelType.ControlGroup, cgNumber),
				`control group ${cgNumber}`,
			)
			if (mute === undefined) return

			this.sendCommand([Buffer.from([0x92, cgIndex, mute ? 0x7f : 0x3f, 0x92, cgIndex, 0])])
			this.controlgroupsMute[cgIndex] = mute ? 1 : 0
			this.checkFeedbacks('cgMute')
		},
	}

	// actions['get_phantom'] = {
	// 	name: 'Get phantom info',
	// 	options: this.listOptions('Input', 64),
	//callback: (action) => {}
	// }

	return actions
}
