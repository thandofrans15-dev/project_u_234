// smr-core-model.js
// This is the math for the reactor. formy is:
// Q = mass_flow_rate * specific_heat * (outlet_temp - inlet_temp)
// I just rearranged it to solve for outlet_temp since that's what we
// want to check against the safety limit. thank you Mlalazi

class ModularReactorModel {
  constructor() {
    this.specificHeat = 4184;   // water, J per kg per degree C
    this.massFlowRate = 600;    // kg of water per second
    this.inletTemp = 250;       // water coming back in, in Celsius
    this.maxTemp = 330;         // if outlet goes above this, its not safe
    this.maxPower = 160;        // biggest the reactor can go, in MW
  }

  // give it the power in MW and it tells you the temps
  getResults(powerMW) {
    var powerWatts = powerMW * 1000000;
    var tempRise = powerWatts / (this.massFlowRate * this.specificHeat);
    var outletTemp = this.inletTemp + tempRise;
    var safe = outletTemp <= this.maxTemp;

    return {
      powerMW: powerMW,
      powerWatts: powerWatts,
      inletTemp: this.inletTemp,
      outletTemp: outletTemp,
      tempRise: tempRise,
      margin: this.maxTemp - outletTemp,
      safe: safe
    };
  }
}

export { ModularReactorModel };
