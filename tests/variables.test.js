import test from 'node:test'
import assert from 'node:assert/strict'
import { getVariables } from '../variables.js'
import * as Helpers from '../helpers.js'

test('Input-to-Zone gauge variables are 1-based and initialized to zero', () => {
	const [definitions, initialValues] = getVariables.bind({
		numberOfInputs: 2,
		numberOfZones: 2,
		numberOfControlGroups: 1,
	})()

	const firstId = Helpers.getVarNameInputToZoneGauge(1, 1)
	const lastId = Helpers.getVarNameInputToZoneGauge(2, 2)

	assert.equal(firstId, 'ip_1_zn_1_gauge')
	assert.equal(lastId, 'ip_2_zn_2_gauge')
	assert.ok(definitions.some((definition) => definition.variableId === firstId))
	assert.ok(definitions.some((definition) => definition.variableId === lastId))
	assert.equal(initialValues[firstId], 0)
	assert.equal(initialValues[lastId], 0)
})

test('AHM fader positions normalize to the Buttons 0-1 gauge range', () => {
	assert.equal(Helpers.normalizeAhmLevel(0), 0)
	assert.equal(Helpers.normalizeAhmLevel(127), 1)
	assert.equal(Helpers.normalizeAhmLevel(64), 64 / 127)
	assert.equal(Helpers.normalizeAhmLevel(-1), undefined)
	assert.equal(Helpers.normalizeAhmLevel(128), undefined)
})
