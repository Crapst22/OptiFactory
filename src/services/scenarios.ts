import type { ProblemData, ConstraintRow, Difficulty } from "@/types"

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function scaleTo(vars: number, arr: number[]): number[] {
  return Array.from({ length: vars }, (_, i) => arr[i] ?? arr[arr.length - 1])
}

function edgeCase(products: string[]): string[] {
  if (products.length < 3) return products
  const shuffled = [...products].sort(() => Math.random() - 0.5)
  return shuffled
}

// ============================================================
// Scenario 1: Carpintería (Woodworking)
// ============================================================
function generateCarpinteria(
  vars: number,
  constraints: number,
  _difficulty: Difficulty,
  problemType: "MAX" | "MIN",
): { problem: ProblemData; narrative: string } {
  const allProducts = ["silla", "mesa", "estante", "armario", "cama"]
  const allResources = [
    { name: "madera", unit: "m²", detail: "de madera" },
    { name: "barniz", unit: "litros", detail: "de barniz" },
    { name: "tornillos", unit: "unidades", detail: "tornillos" },
    { name: "lija", unit: "pliegos", detail: "de lija" },
  ]
  const products = allProducts.slice(0, vars)
  const resources = allResources.slice(0, constraints)

  const coeffs: number[][] = resources.map(() =>
    Array.from({ length: vars }, () => randInt(2, 12)),
  )
  const values: number[] = resources.map((_, i) => {
    const base = randInt(100, 800)
    return i === 1 ? randInt(20, 120) : i === 2 ? randInt(500, 5000) : base
  })
  const objective = Array.from({ length: vars }, () => randInt(15000, 90000))

  const constraintRows: ConstraintRow[] = resources.map((r, i) => ({
    coefficients: coeffs[i],
    operator: "<=",
    value: values[i],
  }))

  // hours constraint
  const hourCoeffs = Array.from({ length: vars }, () => randInt(2, 10))
  const hoursAvail = randInt(200, 800)
  constraintRows.push({ coefficients: hourCoeffs, operator: "<=", value: hoursAvail })

  // ratio constraint (random)
  let ratioSentence = ""
  if (vars >= 2 && Math.random() > 0.5) {
    const [a, b] = [randInt(1, vars) - 1, randInt(1, vars) - 1].sort(() => Math.random() - 0.5)
    if (a !== b) {
      const ratioA = randInt(1, 5)
      const ratioB = randInt(1, 5)
      constraintRows.push({
        coefficients: products.map((_, i) => (i === a ? ratioA : i === b ? -ratioB : 0)),
        operator: "<=",
        value: 0,
      })
      ratioSentence = ` Por experiencia de ventas, por cada ${ratioA} ${products[a]}s se venden al menos ${ratioB} ${products[b]}s.`
    }
  }

  // building narrative
  const productDescs = products.map((p, i) => {
    const parts = resources.map((r, ri) => `${coeffs[ri][i]} ${r.unit} ${r.detail}`)
    const time = hourCoeffs[i]
    return `la ${p} requiere ${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}, además de ${time} horas de trabajo`
  })
  const productList = productDescs.slice(0, -1).join("; ") + "; y " + productDescs[productDescs.length - 1] + "."

  const resourceAvails = resources.map(
    (r, i) => `${values[i]} ${r.unit} ${r.detail}`,
  )
  const resourceStr = resourceAvails.slice(0, -1).join(", ") + " y " + resourceAvails[resourceAvails.length - 1]
  const hoursStr = `${hoursAvail} horas de trabajo`

  const margin = problemType === "MAX" ? "utilidad" : "costo"
  const marginUnit = problemType === "MAX" ? "ganancia" : "costo"
  const marginLines = products
    .map((p, i) => `la ${p} genera un${problemType === "MAX" ? "a" : ""} ${margin} de $${objective[i].toLocaleString()}`)
  const marginStr = marginLines.slice(0, -1).join(", ") + " y " + marginLines[marginLines.length - 1] + "."

  const goal = problemType === "MAX" ? "máximas ganancias" : "mínimos costos"

  const narrative = [
    `Un carpintero fabrica ${vars} tipos de muebles: ${products.join(", ")}. Para su elaboración, ${productList}`,
    `Mensualmente dispone de ${resourceStr} y ${hoursStr}.`,
    `El ${marginUnit} por unidad para ${marginStr}`,
    ratioSentence,
    `Determine cuántas unidades de cada tipo debe producir para obtener las ${goal} totales. Modele el problema.`,
  ].join("\n\n")

  const problem: ProblemData = {
    title: "Taller de Carpintería",
    problemType,
    method: "AUTO",
    variables: vars,
    constraints: constraintRows.length,
    objective,
    constraintsData: constraintRows,
    variableTypes: Array.from({ length: vars }, () => "positive"),
  }

  return { problem, narrative }
}

// ============================================================
// Scenario 2: Taller de Costura (Sewing Workshop)
// ============================================================
function generateCostura(
  vars: number,
  constraints: number,
  _difficulty: Difficulty,
  problemType: "MAX" | "MIN",
): { problem: ProblemData; narrative: string } {
  const allProducts = ["camisa", "pantalón", "vestido", "chaqueta", "abrigo"]
  const allResources = [
    { name: "tela", unit: "metros", detail: "de tela" },
    { name: "hilo", unit: "metros", detail: "de hilo", perUnit: 500, perUnitLabel: "rollo" },
    { name: "botones", unit: "unidades", detail: "botones" },
    { name: "cremalleras", unit: "unidades", detail: "cremalleras" },
  ]
  const products = allProducts.slice(0, vars)
  const resources = allResources.slice(0, constraints)

  const coeffs: number[][] = resources.map(() =>
    Array.from({ length: vars }, () => {
      if (resources.length > 2) return randInt(1, 8)
      return randInt(100, 500)
    }),
  )
  const values: number[] = resources.map((r, ri) => {
    if (r.perUnit) {
      const rolls = randInt(10, 100)
      return rolls * r.perUnit
    }
    return randInt(100, 2000)
  })
  const objective = Array.from({ length: vars }, () => randInt(12000, 80000))

  const constraintRows: ConstraintRow[] = resources.map((r, i) => ({
    coefficients: coeffs[i],
    operator: "<=",
    value: values[i],
  }))

  let hoursSentence = ""
  let ratioSentence = ""
  if (constraints < 5) {
    const hourCoeffs = Array.from({ length: vars }, () => randInt(1, 8))
    const hoursAvail = randInt(150, 600)
    constraintRows.push({ coefficients: hourCoeffs, operator: "<=", value: hoursAvail })
    hoursSentence = `\n\nCada prenda requiere tiempo de confección: ${products.map((p, i) => `${p}: ${hourCoeffs[i]} horas`).join(", ")}. Mensualmente se dispone de ${hoursAvail} horas de trabajo.`
  }

  if (vars >= 2 && Math.random() > 0.5) {
    const [a, b] = [0, vars - 1]
    const ratioA = randInt(2, 5)
    const ratioB = randInt(2, 5)
    constraintRows.push({
      coefficients: products.map((_, i) => (i === a ? ratioA : i === b ? -ratioB : 0)),
      operator: "<=",
      value: 0,
    })
    ratioSentence = ` Por políticas de inventario, por cada ${ratioA} ${products[a]}s se deben producir al menos ${ratioB} ${products[b]}s.`
  }

  const productConsumption = products.map((p, i) => {
    const parts = resources.map((r, ri) => {
      if (r.perUnit) {
        const perUnitVal = r.perUnit
        const coeffVal = coeffs[ri][i]
        const units = Math.ceil(coeffVal / perUnitVal)
        return `${coeffVal} metros de ${r.name} (${units} ${r.perUnitLabel}${units > 1 ? "s" : ""} de ${perUnitVal}m)`
      }
      return `${coeffs[ri][i]} ${r.unit} ${r.detail}`
    })
    return `${p}: ${parts.join(", ")}`
  }).join(";\n")

  const resourceTotal = resources.map((r, i) => {
    if (r.perUnit) {
      const units = Math.ceil(values[i] / r.perUnit)
      return `${units} ${r.perUnitLabel}s de ${r.name} (${values[i].toLocaleString()} metros)`
    }
    return `${values[i].toLocaleString()} ${r.unit} ${r.detail}`
  }).join(", ")

  const margin = problemType === "MAX" ? "ganancia" : "costo"
  const margins = products.map((p, i) => `${p}: $${objective[i].toLocaleString()}`).join(", ")

  const goal = problemType === "MAX" ? "maximizar las ganancias" : "minimizar los costos"

  const narrative = [
    `Un taller de costura produce ${vars} tipos de prendas: ${products.join(", ")}. Cada prenda requiere ciertos insumos:\n${productConsumption}.`,
    `Mensualmente el taller dispone de ${resourceTotal}.` + hoursSentence + ratioSentence,
    `El ${margin} por unidad es: ${margins}.`,
    `El objetivo es ${goal} totales. Modele el problema de programación lineal.`,
  ].join("\n\n")

  const problem: ProblemData = {
    title: "Taller de Costura",
    problemType,
    method: "AUTO",
    variables: vars,
    constraints: constraintRows.length,
    objective,
    constraintsData: constraintRows,
    variableTypes: Array.from({ length: vars }, () => "positive"),
  }

  return { problem, narrative }
}

// ============================================================
// Scenario 3: Fábrica de Alfombras (Carpet Factory — closely matching example)
// ============================================================
function generateAlfombras(
  vars: number,
  constraints: number,
  _difficulty: Difficulty,
  problemType: "MAX" | "MIN",
): { problem: ProblemData; narrative: string } {
  const sizes = ["pequeña", "mediana", "grande", "extra grande", "de lujo"]
  const products = sizes.slice(0, vars)

  // Resource 1: Canvas/cloth rolls (yield-based, inverse coeffs)
  const canvasYields = Array.from({ length: vars }, () => randInt(4, 20))
  const canvasRolls = randInt(8, 30)

  // Resource 2: Thread/yarn (in meters)
  const threadCoeffs = Array.from({ length: vars }, () => randInt(100, 500))
  const threadRolls = randInt(20, 100)
  const threadPerRoll = 500
  const threadTotal = threadRolls * threadPerRoll

  // Resource 3: Nails/fasteners
  const nailCoeffs = Array.from({ length: vars }, () => randInt(50, 200))
  const nailTotal = randInt(5000, 20000)

  const constraintRows: ConstraintRow[] = []

  // Canvas constraint (yield-based)
  constraintRows.push({
    coefficients: canvasYields.map((y) => 1 / y),
    operator: "<=",
    value: canvasRolls,
  })

  // Thread constraint
  constraintRows.push({
    coefficients: threadCoeffs,
    operator: "<=",
    value: threadTotal,
  })

  // Nails constraint
  constraintRows.push({
    coefficients: nailCoeffs,
    operator: "<=",
    value: nailTotal,
  })

  // Hours constraint
  const hourCoeffs = Array.from({ length: vars }, () => randInt(2, 8))
  const hoursTotal = randInt(300, 800)
  constraintRows.push({ coefficients: hourCoeffs, operator: "<=", value: hoursTotal })

  // Ratio constraint (min sales ratio)
  let ratioSentence = ""
  if (vars >= 2 && Math.random() > 0.3) {
    const first = 0
    const last = vars - 1
    const ratioA = randInt(20, 80)
    const ratioB = randInt(20, 80)
    constraintRows.push({
      coefficients: products.map((_, i) => (i === first ? ratioA : i === last ? -ratioB : 0)),
      operator: "<=",
      value: 0,
    })
    ratioSentence = ` La experiencia de ventas indica que por cada ${ratioA} alfombras ${products[first]}s se venden al menos ${ratioB} ${products[last]}s.`
  }

  const objective = Array.from({ length: vars }, () => randInt(15000, 60000))

  const canvasDesc = products
    .map((p, i) => `${p}: ${canvasYields[i]} unidades`)
    .join(", ")
  const threadDesc = products
    .map((p, i) => `${p}: ${threadCoeffs[i]} metros`)
    .join(", ")
  const nailDesc = products
    .map((p, i) => `${p}: ${nailCoeffs[i]} unidades`)
    .join(", ")
  const hourDesc = products
    .map((p, i) => `${p}: ${hourCoeffs[i]} horas`)
    .join(", ")

  const marginStr = products
    .map((p, i) => `${p}: $${objective[i].toLocaleString()}`)
    .join(", ")

  const goal = problemType === "MAX" ? "máximas ganancias" : "mínimos costos"

  const narrative = [
    `Un artesano fabrica y vende ${vars} tipos de alfombras: ${products.join(", ")}.`,
    `De un rollo de lienzo se pueden obtener: ${canvasDesc}. Cada mes se cuenta con ${canvasRolls} rollos de lienzo.`,
    `Los requerimientos de hilo son: ${threadDesc}. Se dispone de ${threadRolls} rollos de hilo de ${threadPerRoll} metros cada uno (${threadTotal.toLocaleString()} metros totales).`,
    `Los requerimientos de clavos son: ${nailDesc}. Se dispone de ${nailTotal.toLocaleString()} clavos mensualmente.`,
    `Las horas de elaboración son: ${hourDesc}. Mensualmente se dispone de ${hoursTotal} horas para la fabricación.`,
    ratioSentence,
    `El margen de utilidad por unidad es: ${marginStr}.`,
    problemType === "MAX"
      ? `Determine cuántas alfombras de cada tipo producir para maximizar las ganancias totales. Modele el problema.`
      : `Determine la combinación de producción que minimice los costos totales. Modele el problema.`,
  ].join("\n\n")

  const problem: ProblemData = {
    title: "Fábrica de Alfombras",
    problemType,
    method: "AUTO",
    variables: vars,
    constraints: constraintRows.length,
    objective,
    constraintsData: constraintRows,
    variableTypes: Array.from({ length: vars }, () => "positive"),
  }

  return { problem, narrative }
}

// ============================================================
// Scenario 4: Fábrica de Juguetes (Toy Factory)
// ============================================================
function generateJuguetes(
  vars: number,
  constraints: number,
  _difficulty: Difficulty,
  problemType: "MAX" | "MIN",
): { problem: ProblemData; narrative: string } {
  const allProducts = ["muñeco", "carro", "pelota", "rompecabezas", "tren"]
  const allResources = [
    { name: "plástico", unit: "kg", detail: "de plástico" },
    { name: "pintura", unit: "litros", detail: "de pintura" },
    { name: "cartón", unit: "m²", detail: "de cartón para empaque" },
    { name: "goma", unit: "kg", detail: "de goma" },
  ]
  const products = allProducts.slice(0, vars)
  const resources = allResources.slice(0, constraints)

  const coeffs: number[][] = resources.map(() =>
    Array.from({ length: vars }, () => randInt(1, 6)),
  )
  const values: number[] = resources.map((_, i) => {
    if (i === 0) return randInt(200, 1000)
    if (i === 1) return randInt(30, 150)
    if (i === 2) return randInt(100, 500)
    return randInt(50, 300)
  })

  const objective = Array.from({ length: vars }, () => randInt(8000, 50000))
  const constraintRows: ConstraintRow[] = resources.map((r, i) => ({
    coefficients: coeffs[i],
    operator: "<=",
    value: values[i],
  }))

  const hourCoeffs = Array.from({ length: vars }, () => randInt(1, 6))
  const hoursAvail = randInt(200, 700)
  constraintRows.push({ coefficients: hourCoeffs, operator: "<=", value: hoursAvail })

  const prodConsumption = products.map((p, i) => {
    const parts = resources.map((r, ri) => `${coeffs[ri][i]} ${r.unit} ${r.detail}`)
    return `${p}: ${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`
  }).join(";\n")

  const resourceAvail = resources.map((r, i) => `${values[i]} ${r.unit} ${r.detail}`).join(", ")
  const margins = products.map((p, i) => `${p}: $${objective[i].toLocaleString()}`).join(", ")

  const goal = problemType === "MAX" ? "maximizar las ganancias" : "minimizar los costos"
  const marginWord = problemType === "MAX" ? "ganancia" : "costo"

  const narrative = [
    `Una fábrica de juguetes produce ${vars} modelos diferentes: ${products.join(", ")}.`,
    `Los requerimientos de materiales para cada juguete son:\n${prodConsumption}.`,
    `Además, cada juguete requiere tiempo de ensamblaje en la línea de producción: ${products.map((p, i) => `${p}: ${hourCoeffs[i]} horas`).join(", ")}.`,
    `Mensualmente la fábrica dispone de ${resourceAvail} y ${hoursAvail} horas de ensamblaje.`,
    `El ${marginWord} por unidad es: ${margins}.`,
    `El objetivo es ${goal} totales. Modele el problema de programación lineal.`,
  ].join("\n\n")

  const problem: ProblemData = {
    title: "Fábrica de Juguetes",
    problemType,
    method: "AUTO",
    variables: vars,
    constraints: constraintRows.length,
    objective,
    constraintsData: constraintRows,
    variableTypes: Array.from({ length: vars }, () => "positive"),
  }

  return { problem, narrative }
}

// ============================================================
// Scenario 5: Panadería (Bakery)
// ============================================================
function generatePanaderia(
  vars: number,
  constraints: number,
  _difficulty: Difficulty,
  problemType: "MAX" | "MIN",
): { problem: ProblemData; narrative: string } {
  const allProducts = ["pan francés", "pastel", "galleta", "dona", "bizcocho"]
  const allResources = [
    { name: "harina", unit: "kg", detail: "de harina" },
    { name: "azúcar", unit: "kg", detail: "de azúcar" },
    { name: "mantequilla", unit: "kg", detail: "de mantequilla" },
    { name: "huevos", unit: "unidades", detail: "huevos" },
  ]
  const products = allProducts.slice(0, vars)
  const resources = allResources.slice(0, constraints)

  const coeffs: number[][] = resources.map(() =>
    Array.from({ length: vars }, () => {
      if (resources.length <= 2) return randInt(1, 5)
      return randInt(100, 500)
    }),
  )
  const values: number[] = resources.map((_, i) => {
    if (i === 0) return randInt(200, 1500)
    if (i === 1) return randInt(50, 400)
    if (i === 2) return randInt(30, 200)
    return randInt(500, 5000)
  })

  const objective = Array.from({ length: vars }, () => randInt(5000, 40000))
  const constraintRows: ConstraintRow[] = resources.map((r, i) => ({
    coefficients: coeffs[i],
    operator: "<=",
    value: values[i],
  }))

  let ovenSentence = ""
  if (constraints < 5) {
    const ovenCoeffs = Array.from({ length: vars }, () => randInt(10, 60))
    const ovenMins = randInt(2000, 10000)
    constraintRows.push({ coefficients: ovenCoeffs, operator: "<=", value: ovenMins })
    ovenSentence = `\n\nLos tiempos de horneado son: ${products.map((p, i) => `${p}: ${ovenCoeffs[i]} minutos`).join(", ")}. El horno está disponible ${Math.round(ovenMins / 60)} horas al mes (${ovenMins} minutos).`
  }

  const prodConsumption = products.map((p, i) => {
    const parts = resources.map((r, ri) => `${coeffs[ri][i]} ${r.unit} ${r.detail}`)
    return `${p}: ${parts.join(", ")}`
  }).join(";\n")

  const resourceAvail = resources.map((r, i) => `${values[i]} ${r.unit} ${r.detail}`).join(", ")
  const margins = products.map((p, i) => `${p}: $${objective[i].toLocaleString()}`).join(", ")

  const goal = problemType === "MAX" ? "maximizar las ganancias" : "minimizar los costos"
  const marginWord = problemType === "MAX" ? "ganancia" : "costo"

  const narrative = [
    `Una panadería artesanal produce ${vars} productos: ${products.join(", ")}.`,
    `Los ingredientes necesarios por lote son:\n${prodConsumption}.` + ovenSentence,
    `Mensualmente la panadería dispone de ${resourceAvail}.`,
    `El ${marginWord} por unidad es: ${margins}.`,
    `El objetivo es ${goal} totales. Modele el problema de programación lineal.`,
  ].join("\n\n")

  const problem: ProblemData = {
    title: "Panadería Artesanal",
    problemType,
    method: "AUTO",
    variables: vars,
    constraints: constraintRows.length,
    objective,
    constraintsData: constraintRows,
    variableTypes: Array.from({ length: vars }, () => "positive"),
  }

  return { problem, narrative }
}

// ============================================================
// Main generator
// ============================================================
const scenarios = [
  generateCarpinteria,
  generateCostura,
  generateAlfombras,
  generateJuguetes,
  generatePanaderia,
]

export function generateScenario(
  variables: number,
  constraints: number,
  difficulty: Difficulty,
  problemType: "MAX" | "MIN",
): { problem: ProblemData; narrative: string } {
  const generator = pick(scenarios)
  return generator(variables, constraints, difficulty, problemType)
}
