import { solveProblem, calculateSensitivity } from './src/services/simplex.js'

const problem = {
  problemType: 'MIN',
  variables: 9, constraints: 6,
  objective: [3, 7, 1, 2, 2, 6, 0, 0, 0],
  constraintsData: [
    { coefficients: [1,1,1,0,0,0,0,0,0], operator: '<=', value: 800 },
    { coefficients: [0,0,0,1,1,1,0,0,0], operator: '<=', value: 1500 },
    { coefficients: [0,0,0,0,0,0,1,1,1], operator: '<=', value: 200 },
    { coefficients: [1,0,0,1,0,0,1,0,0], operator: '>=', value: 1000 },
    { coefficients: [0,1,0,0,1,0,0,1,0], operator: '>=', value: 700 },
    { coefficients: [0,0,1,0,0,1,0,0,1], operator: '>=', value: 800 }
  ],
}

const result = solveProblem(problem)
console.log('Método:', result.method)
console.log('Optimal:', result.optimalValue, 'Status:', result.status)
console.log('Variables:', JSON.stringify(result.variables))

const sens = calculateSensitivity(result, problem)
console.log('\n=== Coeficientes Objetivo ===')
const lindo_obj = [
  {v:'X1',c:3,i:Infinity,d:1},
  {v:'X2',c:7,i:Infinity,d:5},
  {v:'X3',c:1,i:1,d:1},
  {v:'X4',c:2,i:1,d:0},
  {v:'X5',c:2,i:0,d:2},
  {v:'X6',c:6,i:Infinity,d:5},
  {v:'X7',c:0,i:0,d:Infinity},
  {v:'X8',c:0,i:Infinity,d:0},
  {v:'X9',c:0,i:Infinity,d:1},
]
sens.objectiveCoefficients.forEach((c, idx) => {
  const l = lindo_obj[idx]
  const incOK = c.allowIncrease === l.i
  const decOK = c.allowDecrease === l.d
  const ok = incOK && decOK ? '✅' : '❌'
  console.log(`${ok} ${c.variable}: cur=${c.currentValue} inc=${c.allowIncrease} (LINDO:${l.i}) dec=${c.allowDecrease} (LINDO:${l.d})`)
})

console.log('\n=== Restricciones ===')
const lindo_rhs = [
  {r:'R1',v:800,i:Infinity,d:0,p:0},
  {r:'R2',v:1500,i:Infinity,d:0,p:0},
  {r:'R3',v:200,i:800,d:0,p:2},
  {r:'R4',v:1000,i:0,d:800,p:-2},
  {r:'R5',v:700,i:0,d:700,p:-2},
  {r:'R6',v:800,i:0,d:800,p:-1},
]
sens.constraintValues.forEach((c, idx) => {
  const l = lindo_rhs[idx]
  const incOK = c.allowIncrease === l.i
  const decOK = c.allowDecrease === l.d
  const dualOK = c.dualPrice === l.p
  const ok = incOK && decOK && dualOK ? '✅' : '❌'
  console.log(`${ok} ${c.constraint}: RHS=${c.currentValue} inc=${c.allowIncrease} (LINDO:${l.i}) dec=${c.allowDecrease} (LINDO:${l.d}) dual=${c.dualPrice} (LINDO:${l.p})`)
})
