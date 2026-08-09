import test from 'node:test'
import assert from 'node:assert/strict'
import { getFeedbacks } from '../feedbacks.js'
import * as Constants from '../constants.js'

function createContext(level) {
	const polled = []
	const context = {
		numberOfInputs: 16,
		numberOfZones: 16,
		inputsMute: new Array(16).fill(0),
		zonesMute: new Array(16).fill(0),
		controlgroupsMute: new Array(16).fill(0),
		inputsToZonesMute: [],
		monitoredFeedbacks: [],
		getInputToZoneLevel: () => level,
		pollMonitoredFeedback: (feedback) => polled.push(feedback),
	}

	return { context, feedbacks: getFeedbacks.bind(context)(), polled }
}

test('Input-to-Zone level display uses 1-based expression-capable number fields', () => {
	const { feedbacks } = createContext('-12.4')
	const feedback = feedbacks.inputToZoneLevel
	const input = feedback.options.find((option) => option.id === 'input')
	const zone = feedback.options.find((option) => option.id === 'zone')

	assert.equal(feedback.type, 'advanced')
	assert.deepEqual(
		{ type: input.type, default: input.default, min: input.min, max: input.max },
		{ type: 'number', default: 1, min: 1, max: 16 },
	)
	assert.deepEqual(
		{ type: zone.type, default: zone.default, min: zone.min, max: zone.max },
		{ type: 'number', default: 1, min: 1, max: 16 },
	)
})

test('Input-to-Zone level display returns current dB text and optional prefix', () => {
	const { feedbacks } = createContext('-12.4')
	const style = feedbacks.inputToZoneLevel.callback({
		options: { input: 1, zone: 16, prefix: 'Send: ' },
	})

	assert.deepEqual(style, { text: 'Send: -12.4 dB' })
})

test('Input-to-Zone level display shows a placeholder before the first response', () => {
	const { feedbacks } = createContext(undefined)
	const style = feedbacks.inputToZoneLevel.callback({ options: { input: 1, zone: 1, prefix: '' } })

	assert.deepEqual(style, { text: '-- dB' })
})

test('subscribing polls only the selected 1-based Input-to-Zone pair', () => {
	const { context, feedbacks, polled } = createContext('-12.4')
	const feedback = {
		id: 'feedback-1',
		feedbackId: 'inputToZoneLevel',
		options: { input: 2, zone: 15, prefix: '' },
	}

	feedbacks.inputToZoneLevel.subscribe(feedback)

	assert.equal(context.monitoredFeedbacks.length, 1)
	assert.deepEqual(polled[0], {
		id: 'feedback-1',
		type: Constants.MonitoredFeedbackType.Level,
		sendType: Constants.SendType.InputToZone,
		channel: 2,
		sendChannel: 15,
	})

	feedbacks.inputToZoneLevel.unsubscribe(feedback)
	assert.equal(context.monitoredFeedbacks.length, 0)
})
