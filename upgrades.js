import { CreateConvertToBooleanFeedbackUpgradeScript } from '@companion-module/base'

const actionsWithChannelAssignments = new Set([
	'mute_input',
	'mute_zone',
	'input_to_zone',
	'set_level_input',
	'inc_dec_level_input',
	'set_level_zone',
	'inc_dec_level_zone',
	'inc_dec_in_zn_send_level',
	'set_in_zn_send_level',
	'inc_dec_zn_zn_send_level',
	'set_level_controlgroup',
	'inc_dec_level_controlgroup',
	'mute_controlgroup',
	'preset_recall',
	'playback_track',
])

function preserveActionAssignments(props) {
	const changes = {
		updatedConfig: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}

	for (const action of props.actions) {
		if (!actionsWithChannelAssignments.has(action.actionId)) continue

		changes.updatedActions.push({
			...action,
			options: { ...action.options },
		})
	}

	return changes
}

export default [
	CreateConvertToBooleanFeedbackUpgradeScript({
		inputMute: true,
		zoneMute: true,
		inputToZoneMute: true,
	}),
	function v2_1_0(context, props) {
		let changes = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}

		// update config
		if (props.config) {
			let config = props.config
			// ahm_type was introduced in this update, previous installations defaulted to ahm64
			if (config.ahm_type == undefined || config.ahm_type == '') {
				//console.log(`Updating Configuration, AHM Type was ${config.ahm_type}. Now set to default (ahm64).`)
				config.ahm_type = 'ahm64'
				changes.updatedConfig = config
			}
		}

		// update actions
		for (const action of props.actions) {
			// replace option with old name inputChannel with new option name mute_number
			if (action.actionId === 'mute_input' || action.actionId === 'mute_zone' || action.actionId === 'input_to_zone') {
				// check if the action has the option inputChannel (by checking if property exists)
				if (Object.hasOwn(action.options, 'inputChannel')) {
					/* console.log(
						`Updating Configuration, Found action with old option inputChannel=${action.options.inputChannel}, converting to new mute_number`,
					) */

					action.options.mute_number = action.options.inputChannel
					delete action.options.inputChannel

					changes.updatedActions.push(action)
				}
			}
		}

		return changes
	},
	function v2_2_0(context, props) {
		let changes = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}

		// update actions
		for (const action of props.actions) {
			// replace option with old name 'number' with new option name 'incdec_ch_number'
			if (action.actionId === 'inc_dec_level_input' || action.actionId === 'inc_dec_level_zone') {
				// check if the action has the option 'number' (by checking if property exists)
				if (Object.hasOwn(action.options, 'number')) {
					action.options.incdec_ch_number = action.options.number
					delete action.options.number

					changes.updatedActions.push(action)
				}
			}
			// replace option with old name 'number' with new option name 'setlvl_ch_number'
			if (action.actionId === 'set_level_input' || action.actionId === 'set_level_zone') {
				// check if the action has the option 'number' (by checking if property exists)
				if (Object.hasOwn(action.options, 'number')) {
					action.options.setlvl_ch_number = action.options.number
					delete action.options.number

					changes.updatedActions.push(action)
				}
			}
		}

		return changes
	},
	function v3_buttons_preserve_action_assignments(context, props) {
		return preserveActionAssignments(props)
	},
	function v3_buttons_5_preserve_action_assignments(context, props) {
		return preserveActionAssignments(props)
	},
]
