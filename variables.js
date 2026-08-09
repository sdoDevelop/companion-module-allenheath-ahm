import * as Helpers from './helpers.js'

export function getVariables() {
	const variableDefinitions = []
	const variableInitValues = {}

	// generate input level variables
	let unitInAmount = this.numberOfInputs
	for (let i = 1; i <= unitInAmount; i++) {
		let varId = Helpers.getVarNameInputLevel(i)
		variableDefinitions.push({
			name: `Input ${i} Level`,
			variableId: varId,
		})
		// initialize with ?
		variableInitValues[varId] = '?'
	}

	// generate zone level variables
	let unitZoneAmount = this.numberOfZones
	for (let i = 1; i <= unitZoneAmount; i++) {
		let varId = Helpers.getVarNameZoneLevel(i)
		variableDefinitions.push({
			name: `Zone ${i} Level`,
			variableId: varId,
		})
		// initialize with ?
		variableInitValues[varId] = '?'
	}

	// generate control group level variables
	let unitControlGroupAmount = this.numberOfControlGroups
	for (let i = 1; i <= unitControlGroupAmount; i++) {
		let varId = Helpers.getVarNameCGLevel(i)
		variableDefinitions.push({
			name: `Control Group ${i} Level`,
			variableId: varId,
		})
		// initialize with ?
		variableInitValues[varId] = '?'
	}

	// Generate normalized Input-to-Zone gauge variables. Only pairs monitored by
	// feedbacks are requested from AHM and updated while Buttons is running.
	for (let input = 1; input <= this.numberOfInputs; input++) {
		for (let zone = 1; zone <= this.numberOfZones; zone++) {
			const varId = Helpers.getVarNameInputToZoneGauge(input, zone)
			variableDefinitions.push({
				name: `Input ${input} to Zone ${zone} Gauge`,
				variableId: varId,
			})
			variableInitValues[varId] = 0
		}
	}

	return [variableDefinitions, variableInitValues]
}
