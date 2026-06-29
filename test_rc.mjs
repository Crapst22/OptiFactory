import { solveProblem } from './src/services/simplex.js'

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
console.log('Reduced Costs:', JSON.stringify(result.reducedCosts))

const lindo_rc = { X1:1, X2:5, X3:0, X4:0, X5:0, X6:5, X7:0, X8:0, X9:1 }
console.log('\nLINDO RC:', JSON.stringify(lindo_rc))
let allOk = true
for (const [k, v] of Object.entries(result.reducedCosts || {})) {
  const expected = lindo_rc[k]
  const ok = v === expected
  if (!ok) allOk = false
  console.log(`${ok ? '✅' : '❌'} ${k}: app=${v} LINDO=${expected}`)
}
console.log(allOk ? '\n✅ ALL MATCH!' : '\n❌ SOME MISMATCH')
