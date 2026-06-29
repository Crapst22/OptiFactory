import { solveSimplex, calculateSensitivity } from './src/services/simplex.js';

const problem = {
  problemType: 'MIN',
  variables: 9,
  constraints: 6,
  objective: [3, 7, 1, 2, 2, 6, 0, 0, 0],
  constraintsData: [
    { coefficients: [1,1,1,0,0,0,0,0,0], operator: '<=', value: 800 },
    { coefficients: [0,0,0,1,1,1,0,0,0], operator: '<=', value: 1500 },
    { coefficients: [0,0,0,0,0,0,1,1,1], operator: '<=', value: 200 },
    { coefficients: [1,0,0,1,0,0,1,0,0], operator: '>=', value: 1000 },
    { coefficients: [0,1,0,0,1,0,0,1,0], operator: '>=', value: 700 },
    { coefficients: [0,0,1,0,0,1,0,0,1], operator: '>=', value: 800 },
  ],
  method: 'BIG_M',
};

const result = solveSimplex(problem);
console.log('Optimal:', result.optimalValue, 'Status:', result.status);
console.log('Variables:', JSON.stringify(result.variables));

const sens = calculateSensitivity(result, problem);
console.log('\nObjective Coefficients:');
sens.objectiveCoefficients.forEach(c => {
  console.log(c.variable + ': current=' + c.currentValue + ' inc=' + c.allowIncrease + ' dec=' + c.allowDecrease);
});
console.log('\nConstraints:');
sens.constraintValues.forEach(c => {
  console.log(c.constraint + ': RHS=' + c.currentValue + ' inc=' + c.allowIncrease + ' dec=' + c.allowDecrease + ' dual=' + c.dualPrice + ' binding=' + c.isBinding);
});
