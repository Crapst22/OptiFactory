import { solveTwoPhase } from './src/services/simplex.js'

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
  method: 'BIG_M',
}

const result = solveTwoPhase(problem)
console.log('\n=== RESULT ===')
console.log('Optimal:', result.optimalValue, 'Status:', result.status)
console.log('Variables:', JSON.stringify(result.variables))

console.log('\n=== ALL STEPS ===')
result.steps.forEach((s, idx) => {
  console.log(`\n--- Step ${idx} (iter ${s.iteration}) ---`)
  console.log('Optimal?', s.isOptimal)
  if (s.enteringVariable) console.log(`Enter: ${s.enteringVariable}, Leave: ${s.leavingVariable}`)
  const { headers, rows, zRow, basis, solution } = s.table
  console.log('Basis:', JSON.stringify(basis))
  console.log('Solution:', JSON.stringify(solution.map(v => Math.round(v*100)/100)))
  console.log('zRow X1-X9:', zRow.slice(0, 9).map(v => v.toFixed(2)))
  console.log('zRow slack:', zRow.slice(9, 15).map(v => v.toFixed(2)))
  if (headers.length > 15) console.log('zRow artif:', zRow.slice(15, 19).map(v => v.toFixed(2)))
})
