import type { ProblemData, ConstraintRow, Difficulty } from "@/types"

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
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
    { name: "madera", unit: "m²" },
    { name: "barniz", unit: "litros" },
    { name: "tornillos", unit: "unidades" },
    { name: "lija", unit: "pliegos" },
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

  const hourCoeffs = Array.from({ length: vars }, () => randInt(2, 10))
  const hoursAvail = randInt(200, 800)
  constraintRows.push({ coefficients: hourCoeffs, operator: "<=", value: hoursAvail })

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
      ratioSentence = ` Por experiencia del dueño, por cada ${ratioA} ${products[a]}s que ingresan al taller se terminan vendiendo al menos ${ratioB} ${products[b]}s, por lo que la producción debe mantener esa proporción mínima.`
    }
  }

  const consumos = products.map((p, i) => {
    const parts = resources.map((r, ri) => `${coeffs[ri][i]} ${r.unit} de ${r.name}`)
    const time = hourCoeffs[i]
    return `cada ${p} requiere ${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}, ocupando ${time} horas de trabajo`
  })

  const margins = products.map((p, i) => `$${objective[i].toLocaleString()} por ${p}`)

  const resourceParts = resources.map((r, i) => `${values[i]} ${r.unit} de ${r.name}`)

  const narrative = [
    `Un carpintero fabrica ${products[0]}s, ${products.slice(1, -1).join("s, ")}${products.length > 2 ? "s y " : " y "}${products[products.length - 1]}s. Para su elaboración, ${consumos.slice(0, -1).join("; ")}; y ${consumos[consumos.length - 1]}.`,
    `El taller dispone mensualmente de ${resourceParts.slice(0, -1).join(", ")} y ${resourceParts[resourceParts.length - 1]}, además de ${hoursAvail} horas de mano de obra.` + ratioSentence,
    `Los márgenes de ganancia son de ${margins.slice(0, -1).join(", ")} y ${margins[margins.length - 1]}.`,
    `Modele el problema de programación lineal para ${problemType === "MAX" ? "maximizar la ganancia" : "minimizar el costo"} total mensual.`,
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
  const resources = [
    { name: "tela", unit: "metros" },
    { name: "hilo", unit: "metros", perUnit: 500 },
    { name: "botones", unit: "unidades" },
    { name: "cremalleras", unit: "unidades" },
  ].slice(0, constraints)
  const products = allProducts.slice(0, vars)

  const coeffs: number[][] = resources.map(() =>
    Array.from({ length: vars }, () => randInt(100, 500)),
  )
  const values: number[] = resources.map((r) => {
    if (r.perUnit) {
      const rolls = randInt(10, 100)
      return rolls * r.perUnit
    }
    return randInt(300, 3000)
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
    hoursSentence = ` Además, cada ${products[0]} requiere ${hourCoeffs[0]} horas de confección, cada ${products[Math.min(1, products.length - 1)]} ${hourCoeffs[Math.min(1, products.length - 1)]} horas${products.length > 2 ? `, y así sucesivamente` : ""}, y se dispone de ${hoursAvail} horas de taller al mes.`
  }

  if (vars >= 2 && Math.random() > 0.5) {
    const a = 0
    const b = vars - 1
    const ratioA = randInt(2, 5)
    const ratioB = randInt(2, 5)
    constraintRows.push({
      coefficients: products.map((_, i) => (i === a ? ratioA : i === b ? -ratioB : 0)),
      operator: "<=",
      value: 0,
    })
    ratioSentence = ` Las políticas de inventario exigen que por cada ${ratioA} ${products[a]}s producidas deben fabricarse al menos ${ratioB} ${products[b]}s.`
  }

  const consumoParts = products.map((p, i) => {
    const parts = resources.map((r, ri) => `${coeffs[ri][i]} ${r.unit} de ${r.name}`)
    return `${p} necesita ${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`
  })

  let resourceLine = ""
  const resParts = resources.map((r, i) => {
    if (r.perUnit) {
      const units = Math.ceil(values[i] / r.perUnit)
      return `${units} rollos de ${r.name} (${values[i].toLocaleString()} metros en total)`
    }
    return `${values[i].toLocaleString()} ${r.unit} de ${r.name}`
  })
  resourceLine = resParts.slice(0, -1).join(", ") + " y " + resParts[resParts.length - 1]

  const margins = products.map((p, i) => `$${objective[i].toLocaleString()} por ${p}`)

  const narrative = [
    `Un taller de confección produce ${products.join(", ")}. Los insumos requeridos son los siguientes: ${consumoParts.slice(0, -1).join("; ")}; y ${consumoParts[consumoParts.length - 1]}.` + hoursSentence + ratioSentence,
    `Mensualmente el taller dispone de ${resourceLine}.`,
    `Los ${problemType === "MAX" ? "márgenes de ganancia" : "costos"} por prenda son de ${margins.slice(0, -1).join(", ")} y ${margins[margins.length - 1]}.`,
    `Modele el problema de programación lineal para ${problemType === "MAX" ? "maximizar la ganancia" : "minimizar el costo"} total mensual.`,
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
// Scenario 3: Fábrica de Alfombras (Carpet Factory)
// ============================================================
function generateAlfombras(
  vars: number,
  constraints: number,
  _difficulty: Difficulty,
  problemType: "MAX" | "MIN",
): { problem: ProblemData; narrative: string } {
  const sizes = ["pequeña", "mediana", "grande", "extra grande", "de lujo"]
  const products = sizes.slice(0, vars)

  const canvasYields = Array.from({ length: vars }, () => randInt(4, 20))
  const canvasRolls = randInt(8, 30)

  const threadCoeffs = Array.from({ length: vars }, () => randInt(100, 500))
  const threadRolls = randInt(20, 100)
  const threadPerRoll = 500
  const threadTotal = threadRolls * threadPerRoll

  const nailCoeffs = Array.from({ length: vars }, () => randInt(50, 200))
  const nailTotal = randInt(5000, 20000)

  const constraintRows: ConstraintRow[] = []

  constraintRows.push({
    coefficients: canvasYields.map((y) => 1 / y),
    operator: "<=",
    value: canvasRolls,
  })

  constraintRows.push({
    coefficients: threadCoeffs,
    operator: "<=",
    value: threadTotal,
  })

  constraintRows.push({
    coefficients: nailCoeffs,
    operator: "<=",
    value: nailTotal,
  })

  const hourCoeffs = Array.from({ length: vars }, () => randInt(2, 8))
  const hoursTotal = randInt(300, 800)
  constraintRows.push({ coefficients: hourCoeffs, operator: "<=", value: hoursTotal })

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
    ratioSentence = ` Según el historial de ventas, por cada ${ratioA} alfombras ${products[first]}s que salen del taller se venden al menos ${ratioB} ${products[last]}s.`
  }

  const objective = Array.from({ length: vars }, () => randInt(15000, 60000))

  const narrative = [
    `Un artesano elabora ${vars} tipos de alfombras: ${products.join(", ")}. De un rollo de lienzo se pueden obtener ${products.map((p, i) => `${canvasYields[i]} ${p}s`).slice(0, -1).join(", ")} o ${canvasYields[canvasYields.length - 1]} ${products[products.length - 1]}s. Mensualmente se reciben ${canvasRolls} rollos de lienzo.`,
    `Los requerimientos de hilo son de ${threadCoeffs.map((c, i) => `${c} metros para la ${products[i]}`).slice(0, -1).join(", ")} y ${threadCoeffs[threadCoeffs.length - 1]} metros para la ${products[products.length - 1]}. Se cuenta con ${threadRolls} rollos de hilo de ${threadPerRoll} metros cada uno (${threadTotal.toLocaleString()} metros). En cuanto a clavos, se necesitan ${nailCoeffs.map((c, i) => `${c} para la ${products[i]}`).slice(0, -1).join(", ")} y ${nailCoeffs[nailCoeffs.length - 1]} para la ${products[products.length - 1]}, disponiendo de ${nailTotal.toLocaleString()} clavos al mes.`,
    `Los tiempos de elaboración son de ${hourCoeffs.map((c, i) => `${c} horas para la ${products[i]}`).slice(0, -1).join(", ")} y ${hourCoeffs[hourCoeffs.length - 1]} horas para la ${products[products.length - 1]}, con ${hoursTotal} horas disponibles mensualmente.` + ratioSentence,
    `Los márgenes de utilidad son de $${objective.map((o, i) => `${o.toLocaleString()} por alfombra ${products[i]}`).slice(0, -1).join(", ")} y $${objective[objective.length - 1].toLocaleString()} por alfombra ${products[products.length - 1]}.`,
    `Modele el problema de programación lineal para ${problemType === "MAX" ? "maximizar la ganancia mensual" : "minimizar el costo mensual"}.`,
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
    { name: "plástico", unit: "kg" },
    { name: "pintura", unit: "litros" },
    { name: "cartón", unit: "m²" },
    { name: "goma", unit: "kg" },
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

  const margins = products.map((p, i) => `${p} genera $${objective[i].toLocaleString()}`)

  const narrative = [
    `En una fábrica de juguetes se producen ${products.join(", ")}. Los materiales necesarios son: ${products.map((p, i) => {
      const parts = resources.map((r, ri) => `${coeffs[ri][i]} ${r.unit} de ${r.name}`)
      return `cada ${p} consume ${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`
    }).slice(0, -1).join("; ")}; y ${products.length > 1 ? products.map((p, i) => {
      const parts = resources.map((r, ri) => `${coeffs[ri][i]} ${r.unit} de ${r.name}`)
      return `cada ${p} consume ${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`
    })[products.length - 1] : ""}. Cada juguete requiere además tiempo de ensamblaje: ${products.map((p, i) => `${hourCoeffs[i]} horas por ${p}`).slice(0, -1).join(", ")} y ${hourCoeffs[hourCoeffs.length - 1]} horas por ${products[products.length - 1]}.`,
    `La fábrica cuenta mensualmente con ${resources.map((r, i) => `${values[i]} ${r.unit} de ${r.name}`).slice(0, -1).join(", ")} y ${values[resources.length - 1]} ${resources[resources.length - 1].unit} de ${resources[resources.length - 1].name}, además de ${hoursAvail} horas de ensamblaje.`,
    `En términos de rentabilidad, cada ${margins.slice(0, -1).join(", cada ")} y cada ${margins[margins.length - 1]}.`,
    `Modele el problema de programación lineal para ${problemType === "MAX" ? "maximizar la ganancia" : "minimizar el costo"} mensual.`,
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
    { name: "harina", unit: "kg" },
    { name: "azúcar", unit: "kg" },
    { name: "mantequilla", unit: "kg" },
    { name: "huevos", unit: "unidades" },
  ]
  const products = allProducts.slice(0, vars)
  const resources = allResources.slice(0, constraints)

  const coeffs: number[][] = resources.map(() =>
    Array.from({ length: vars }, () => randInt(100, 500)),
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
    ovenSentence = ` Los tiempos de horneado son de ${ovenCoeffs.map((c, i) => `${c} minutos para ${products[i]}`).slice(0, -1).join(", ")} y ${ovenCoeffs[ovenCoeffs.length - 1]} minutos para ${products[products.length - 1]}, con una disponibilidad de horno de ${Math.round(ovenMins / 60)} horas (${ovenMins} minutos) al mes.`
  }

  const narrative = [
    `Una panadería artesanal prepara ${products.join(", ")}. Las cantidades de ingredientes por lote son: ${products.map((p, i) => {
      const parts = resources.map((r, ri) => `${coeffs[ri][i]} ${r.unit} de ${r.name}`)
      return `${p} lleva ${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`
    }).slice(0, -1).join("; ")}; y ${products.length > 1 ? products.map((p, i) => {
      const parts = resources.map((r, ri) => `${coeffs[ri][i]} ${r.unit} de ${r.name}`)
      return `${p} lleva ${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`
    })[products.length - 1] : ""}.` + ovenSentence,
    `Mensualmente la panadería dispone de ${resources.map((r, i) => `${values[i]} ${r.unit} de ${r.name}`).slice(0, -1).join(", ")} y ${values[resources.length - 1]} ${resources[resources.length - 1].unit} de ${resources[resources.length - 1].name}.`,
    `Cada ${products.map((p, i) => `${p} deja una ${problemType === "MAX" ? "ganancia" : "utilidad"} de $${objective[i].toLocaleString()}`).slice(0, -1).join(", cada ")} y cada ${products[products.length - 1]} deja una ${problemType === "MAX" ? "ganancia" : "utilidad"} de $${objective[objective.length - 1].toLocaleString()}.`,
    `Modele el problema de programación lineal para ${problemType === "MAX" ? "maximizar la ganancia" : "minimizar el costo"} mensual.`,
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
