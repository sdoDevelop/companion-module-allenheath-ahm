import test from 'node:test'
import assert from 'node:assert/strict'
import UpgradeScripts from '../upgrades.js'

test('legacy level option names migrate in the correct direction', () => {
	const props = {
		config: {},
		actions: [
			{ actionId: 'inc_dec_level_input', options: { number: 7, incdec: 'inc' } },
			{ actionId: 'set_level_zone', options: { number: 12, level: 105 } },
		],
		feedbacks: [],
	}

	const changes = UpgradeScripts[2]({}, props)

	assert.equal(changes.updatedActions[0].options.incdec_ch_number, 7)
	assert.equal(changes.updatedActions[0].options.number, undefined)
	assert.equal(changes.updatedActions[1].options.setlvl_ch_number, 12)
	assert.equal(changes.updatedActions[1].options.number, undefined)
})

test('Buttons upgrades preserve literal and expression action assignments', () => {
	const props = {
		config: { ahm_type: 'ahm16' },
		actions: [
			{
				actionId: 'input_to_zone',
				options: {
					mute_number: '$(position.state.mic_input)',
					number: '$(position.state.zone_output)',
					operation: 'toggle',
				},
			},
			{ actionId: 'mute_input', options: { mute_number: 9, operation: 'toggle' } },
		],
		feedbacks: [],
	}

	const changes = UpgradeScripts.at(-1)({}, props)

	assert.deepEqual(changes.updatedActions[0].options, props.actions[0].options)
	assert.deepEqual(changes.updatedActions[1].options, props.actions[1].options)
	assert.notEqual(changes.updatedActions[0], props.actions[0])
	assert.notEqual(changes.updatedActions[0].options, props.actions[0].options)
})
