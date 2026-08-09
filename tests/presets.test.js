import test from 'node:test'
import assert from 'node:assert/strict'
import { getPresets } from '../presets.js'

test('generated mute presets use 1-based action channel numbers', () => {
	const presets = getPresets.bind({
		numberOfInputs: 2,
		numberOfZones: 2,
		numberOfControlGroups: 2,
	})()

	const firstInput = presets.find((preset) => preset.name === 'Mute Input 1')
	const secondInput = presets.find((preset) => preset.name === 'Mute Input 2')
	const firstZone = presets.find((preset) => preset.name === 'Mute Zone 1')
	const firstControlGroup = presets.find((preset) => preset.name === 'Mute CG 1')

	assert.equal(firstInput.steps[0].down[0].options.mute_number, 1)
	assert.equal(secondInput.steps[0].down[0].options.mute_number, 2)
	assert.equal(firstZone.steps[0].down[0].options.mute_number, 1)
	assert.equal(firstControlGroup.steps[0].down[0].options.mute_number, 1)
})
