/* smr-core-model.js
   Core thermal-hydraulic engine for the SMR simulation.
   Q = m_dot * Cp * (T_out - T_in)
   This is the single source of truth — every mode that shows reactor
   numbers should import this rather than recalculating anything locally.
*/
export class ModularReactorModel {
  constructor() {
    this.coolantSpecificHeat = 4184;   // J/kg°C, pressurized water
    this.massFlowRate = 600.0;         // kg/s, nominal pump-assisted flow
    this.targetInletTemp = 250.0;      // °C, water returning from steam generator
    this.maxAllowedTemp = 330.0;       // °C, safety boundary
    this.designPowerMW = 160.0;        // MWth ceiling, iPWR-class module
  }

  calculateCoreThermalHydraulics(corePowerMW) {
    const powerWatts = corePowerMW * 1_000_000;
    const tempRise = powerWatts / (this.massFlowRate * this.coolantSpecificHeat);
    const outletTemp = this.targetInletTemp + tempRise;
    const isSafe = outletTemp <= this.maxAllowedTemp;
    return {
      powerMW: corePowerMW,
      powerWatts,
      inletTemp: this.targetInletTemp,
      outletTemp,
      tempRise,
      margin: this.maxAllowedTemp - outletTemp,
      isSafe
    };
  }
}
