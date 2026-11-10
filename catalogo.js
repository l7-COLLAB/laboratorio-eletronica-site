const catalogo = {
  "modules": [
    {
      "id": "M00",
      "name": "Como aprender sem depender apenas de exercícios",
      "category": "Método de estudo",
      "summary": "Como usar a apostila, verificar respostas e registrar dificuldades"
    },
    {
      "id": "M01",
      "name": "Aritmética, frações e proporções",
      "category": "Matemática",
      "summary": "Operações, frações, decimais, porcentagens e regra de três"
    },
    {
      "id": "M02",
      "name": "Álgebra, expressões e equações do primeiro grau",
      "category": "Matemática",
      "summary": "Expressões, sinais, distributiva, equações e sistemas"
    },
    {
      "id": "M03",
      "name": "Equações do segundo grau: fatoração e Bhaskara",
      "category": "Matemática",
      "summary": "Fatoração, produto nulo e fórmula de Bhaskara"
    },
    {
      "id": "M04",
      "name": "Potências, raízes, notação científica e logaritmos",
      "category": "Matemática",
      "summary": "Expoentes, raízes, prefixos, logaritmos introdutórios"
    },
    {
      "id": "M05",
      "name": "Funções, gráficos e geometria analítica",
      "category": "Matemática",
      "summary": "Plano cartesiano, reta, parábola e interpretação de gráficos"
    },
    {
      "id": "M06",
      "name": "Geometria, triângulos, trigonometria e vetores",
      "category": "Matemática",
      "summary": "Ângulos, Pitágoras, seno, cosseno e vetores"
    },
    {
      "id": "M07",
      "name": "Grandezas físicas, unidades, medições e incertezas",
      "category": "Física e medições",
      "summary": "Sistema Internacional, conversões, precisão e incertezas"
    },
    {
      "id": "M08",
      "name": "Física essencial: movimento, forças, energia e potência",
      "category": "Física e medições",
      "summary": "Movimento, forças, energia e potência"
    },
    {
      "id": "M09",
      "name": "Eletricidade e circuitos: a base para Engenharia Eletrônica",
      "category": "Circuitos e eletrônica",
      "summary": "Tensão, corrente, resistência, Lei de Ohm, associações e potência"
    },
    {
      "id": "M10",
      "name": "Primeiros conceitos de eletrônica, materiais e lógica digital",
      "category": "Circuitos e eletrônica",
      "summary": "Diodos, transistores, semicondutores, binário e portas lógicas"
    },
    {
      "id": "M11",
      "name": "Raciocínio lógico e introdução ao Python",
      "category": "Computação e lógica",
      "summary": "Algoritmos, variáveis, condições, laços e Python"
    },
    {
      "id": "M12",
      "name": "Noções científicas, relatório técnico e inglês de leitura",
      "category": "Pesquisa e comunicação",
      "summary": "Matéria, modelos, método científico, relatórios e inglês técnico"
    },
    {
      "id": "M13",
      "name": "Ponte para Cálculo I: variação e limites",
      "category": "Matemática",
      "summary": "Variação, inclinação, limites intuitivos e derivada como taxa"
    }
  ],
  "projects": [
    {
      "title": "Raízes e gráficos de uma parábola",
      "category": "Matemática",
      "goal": "Descobrir como a fatoração prevê os pontos em que a parábola cruza o eixo x.",
      "steps": [
        "Leia o exemplo resolvido de x² − 6x + 8 na M03.",
        "Fatore x² − 5x + 6 e confira as raízes por substituição.",
        "Marque as raízes no gráfico e compare com um exemplo de raiz dupla."
      ],
      "deliverable": "Um gráfico anotado e uma explicação de como você confirmou as raízes.",
      "order": 10,
      "status": "A fazer",
      "moduleId": "M03"
    },
    {
      "title": "Seno e cosseno em um triângulo",
      "category": "Matemática",
      "goal": "Identificar o cateto oposto, o adjacente e a hipotenusa em relação ao ângulo escolhido.",
      "steps": [
        "Reveja as definições da M06 e desenhe um triângulo 30°–60°–90°.",
        "Calcule sen(30°) e cos(60°) com as medidas do desenho.",
        "Explique por que os dois resultados coincidem e repita com um triângulo 3–4–5."
      ],
      "deliverable": "Um desenho com os lados identificados e quatro razões trigonométricas justificadas.",
      "order": 20,
      "status": "A fazer",
      "moduleId": "M06"
    },
    {
      "title": "Tabela de medições e incertezas",
      "category": "Física e medições",
      "goal": "Distinguir valor médio, dispersão e resolução do instrumento.",
      "steps": [
        "Leia a M07 e escolha um objeto para medir com régua.",
        "Meça o comprimento cinco vezes e registre a unidade e a resolução da régua.",
        "Calcule a média e a diferença entre a maior e a menor leitura."
      ],
      "deliverable": "Tabela com cinco leituras, média, amplitude e comentário sobre variação.",
      "order": 30,
      "status": "A fazer",
      "moduleId": "M07"
    },
    {
      "title": "Divisor de tensão de 5 V",
      "category": "Circuitos e eletrônica",
      "goal": "Prever a tensão de saída em um divisor resistivo e conferir em simulador.",
      "steps": [
        "Revise a Lei de Ohm na M09.",
        "No simulador, ligue dois resistores de 1 kΩ em série a 5 V e compare a tensão do ponto médio com sua previsão.",
        "Troque o resistor ligado ao terra por 2 kΩ e repita a comparação."
      ],
      "deliverable": "Esquema e tabela para os dois casos, com cálculo, resultado simulado e unidades.",
      "order": 40,
      "status": "A fazer",
      "moduleId": "M09"
    },
    {
      "title": "Alarme virtual com duas entradas",
      "category": "Computação e lógica",
      "goal": "Traduzir uma regra simples de acionamento em uma expressão lógica.",
      "steps": [
        "Revise as portas AND e NOT na M10.",
        "Modele a regra: alarme toca quando a porta está aberta e o sistema está armado.",
        "Preencha as quatro combinações e reproduza o circuito em um simulador lógico."
      ],
      "deliverable": "Tabela-verdade, expressão lógica e captura da simulação.",
      "order": 50,
      "status": "A fazer",
      "moduleId": "M10"
    },
    {
      "title": "Calculadora da Lei de Ohm em Python",
      "category": "Computação e lógica",
      "goal": "Transformar a fórmula da corrente em um programa simples com validação.",
      "steps": [
        "Leia a M11 e comece com tensão em volts e resistência em ohms.",
        "Calcule a corrente em miliampères e rejeite resistência menor ou igual a zero.",
        "Teste 9 V e 3000 Ω, 12 V e 2000 Ω, e um caso com resistência zero."
      ],
      "deliverable": "Código curto e uma tabela com três testes, incluindo o caso inválido.",
      "order": 60,
      "status": "A fazer",
      "moduleId": "M11"
    },
    {
      "title": "Inversor CMOS em simulação",
      "category": "Microeletrônica",
      "goal": "Relacionar a função lógica NOT ao comportamento de um par NMOS e PMOS.",
      "steps": [
        "Consolide portas lógicas e MOSFET antes de começar.",
        "Use um modelo didático de inversor CMOS em um simulador e teste os dois níveis de entrada.",
        "Registre quais transistores conduzem em cada situação e compare com a tabela-verdade."
      ],
      "deliverable": "Esquema simulado, tabela de entrada e saída e explicação do papel de cada transistor.",
      "order": 70,
      "status": "A fazer",
      "moduleId": "M10"
    },
    {
      "title": "Minirrelatório de um experimento",
      "category": "Pesquisa e comunicação",
      "goal": "Documentar um teste de forma que outra pessoa possa reproduzi-lo.",
      "steps": [
        "Escolha o divisor de tensão ou a tabela de medições.",
        "Registre pergunta, hipótese, método, dados e limitações.",
        "Revise se outra pessoa conseguiria repetir o experimento usando apenas seu relatório."
      ],
      "deliverable": "Relatório de uma página com uma tabela e uma conclusão ligada aos dados.",
      "order": 80,
      "status": "A fazer",
      "moduleId": "M12"
    }
  ],
  "semesters": [
    {
      "number": 1,
      "name": "Fundamentos matemáticos, científicos e eletrônicos",
      "subjects": [
        {
          "id": "01",
          "name": "Cálculo Diferencial e Integral I",
          "summary": "Funções, limites, derivadas e integrais."
        },
        {
          "id": "02",
          "name": "Álgebra Linear e Geometria Analítica",
          "summary": "Vetores, matrizes, sistemas lineares e autovalores."
        },
        {
          "id": "03",
          "name": "Física I — Mecânica",
          "summary": "Cinemática, dinâmica, energia e rotações."
        },
        {
          "id": "04",
          "name": "Química Geral e Ciência dos Materiais",
          "summary": "Átomos, ligações, cristais e silício."
        },
        {
          "id": "05",
          "name": "Algoritmos e Programação em Python",
          "summary": "Algoritmos, funções, estruturas básicas e computação numérica."
        },
        {
          "id": "06",
          "name": "Introdução à Engenharia Eletrônica",
          "summary": "Grandezas, componentes, segurança, esquemáticos e metrologia."
        }
      ],
      "project": "Circuitos de baixa tensão, cálculos, simulação e documentação didática."
    },
    {
      "number": 2,
      "name": "Eletricidade e análise de circuitos",
      "subjects": [
        {
          "id": "07",
          "name": "Cálculo Diferencial e Integral II",
          "summary": "Integrais avançadas, séries e aplicações."
        },
        {
          "id": "08",
          "name": "Física II — Eletricidade e Magnetismo",
          "summary": "Campos, potenciais, capacitores, correntes e indução."
        },
        {
          "id": "09",
          "name": "Circuitos Elétricos I",
          "summary": "Kirchhoff, malhas, nós, Thévenin e Norton."
        },
        {
          "id": "10",
          "name": "Programação C e Estruturas de Dados",
          "summary": "Memória, ponteiros, estruturas e algoritmos."
        },
        {
          "id": "11",
          "name": "Desenho Técnico e CAD Eletrônico",
          "summary": "Diagramas e projeto elementar de PCB."
        },
        {
          "id": "12",
          "name": "Física Experimental e Metrologia",
          "summary": "Incertezas, erros, medidas e calibração."
        }
      ],
      "project": "Esquemático e projeto de placa didática com documentação."
    },
    {
      "number": 3,
      "name": "Eletrônica analógica e digital",
      "subjects": [
        {
          "id": "13",
          "name": "Cálculo III e Cálculo Vetorial",
          "summary": "Derivadas parciais, integrais múltiplas e campos vetoriais."
        },
        {
          "id": "14",
          "name": "Equações Diferenciais e Variáveis Complexas",
          "summary": "EDO, números complexos e sistemas dinâmicos."
        },
        {
          "id": "15",
          "name": "Física III — Ondas e Física Moderna",
          "summary": "Oscilações, ondas, óptica e física quântica introdutória."
        },
        {
          "id": "16",
          "name": "Circuitos Elétricos II",
          "summary": "RLC, transitórios, fasores e Laplace."
        },
        {
          "id": "17",
          "name": "Lógica Digital e Matemática Discreta",
          "summary": "Portas, álgebra booleana e lógica sequencial."
        },
        {
          "id": "18",
          "name": "Eletrônica Analógica I",
          "summary": "Diodos, transistores BJT, polarização e amplificação."
        }
      ],
      "project": "Cadeia de medição com estágio analógico e indicação lógica."
    },
    {
      "number": 4,
      "name": "Sinais, sistemas e modelagem",
      "subjects": [
        {
          "id": "19",
          "name": "Probabilidade, Estatística e Processos Aleatórios",
          "summary": "Distribuições, inferência, ruído e processos estocásticos."
        },
        {
          "id": "20",
          "name": "Métodos Numéricos e Otimização",
          "summary": "Solução numérica, interpolação, integração e otimização."
        },
        {
          "id": "21",
          "name": "Eletromagnetismo Aplicado",
          "summary": "Maxwell, ondas e linhas de transmissão."
        },
        {
          "id": "22",
          "name": "Sinais e Sistemas",
          "summary": "Convolução, Fourier, Laplace, Z e amostragem."
        },
        {
          "id": "23",
          "name": "Eletrônica Analógica II",
          "summary": "MOSFET, pequenos sinais, diferencial e realimentação."
        },
        {
          "id": "24",
          "name": "Sistemas Digitais e Linguagens de Hardware",
          "summary": "Verilog/SystemVerilog, FPGA e temporização."
        }
      ],
      "project": "Aquisição de sinais: comparação entre cálculo, simulação e medição."
    },
    {
      "number": 5,
      "name": "Física e dispositivos semicondutores",
      "subjects": [
        {
          "id": "25",
          "name": "Física do Estado Sólido e Materiais Semicondutores",
          "summary": "Cristais, bandas, estatística de portadores e transporte."
        },
        {
          "id": "26",
          "name": "Dispositivos Semicondutores I",
          "summary": "Dopagem, deriva, difusão, junção PN, MOS e MOSFET."
        },
        {
          "id": "27",
          "name": "Instrumentação Eletrônica e Conversão de Sinais",
          "summary": "Sensores, calibração, ADC/DAC e amplificação."
        },
        {
          "id": "28",
          "name": "Processamento Digital de Sinais",
          "summary": "DFT/FFT, filtros FIR/IIR e quantização."
        },
        {
          "id": "29",
          "name": "Microcontroladores e Sistemas Embarcados",
          "summary": "Periféricos, interrupções, barramentos e firmware."
        },
        {
          "id": "30",
          "name": "Fenômenos de Transporte e Termodinâmica Aplicada",
          "summary": "Condução térmica, convecção e dissipação."
        }
      ],
      "project": "Sistema sensor de baixo consumo com balanço energético."
    },
    {
      "number": 6,
      "name": "Tecnologia CMOS e microfabricação",
      "subjects": [
        {
          "id": "31",
          "name": "Dispositivos Semicondutores II",
          "summary": "Modelos MOS avançados, canal curto e capacitâncias."
        },
        {
          "id": "32",
          "name": "Projeto de Circuitos Integrados Analógicos I",
          "summary": "Espelhos de corrente, pares diferenciais, ganho e ruído."
        },
        {
          "id": "33",
          "name": "Projeto de Circuitos Integrados Digitais I",
          "summary": "Portas CMOS, dimensionamento, atraso, potência e VLSI."
        },
        {
          "id": "34",
          "name": "Processos de Microfabricação I",
          "summary": "Litografia, oxidação, implantação e filmes finos."
        },
        {
          "id": "35",
          "name": "Sistemas de Controle",
          "summary": "Estabilidade, realimentação e compensação."
        },
        {
          "id": "36",
          "name": "Comunicações Eletrônicas e Fundamentos de RF",
          "summary": "Modulação, ruído, largura de banda e impedância."
        }
      ],
      "project": "Biblioteca de portas CMOS com análise de consumo e atraso."
    },
    {
      "number": 7,
      "name": "Projeto profissional de circuitos integrados",
      "subjects": [
        {
          "id": "37",
          "name": "Processos de Microfabricação II",
          "summary": "Gravação, deposição, CMP e interconexões."
        },
        {
          "id": "38",
          "name": "Projeto de Circuitos Integrados Analógicos II",
          "summary": "Amplificadores operacionais CMOS e compensação."
        },
        {
          "id": "39",
          "name": "Arquitetura e Projeto Digital de ASICs/SoCs",
          "summary": "RTL, síntese, memórias, barramentos e temporização."
        },
        {
          "id": "40",
          "name": "Caracterização de Materiais e Dispositivos",
          "summary": "Curvas I-V/C-V, extração de parâmetros e análise."
        },
        {
          "id": "41",
          "name": "Integridade de Sinais, EMC e Projeto de PCB",
          "summary": "Ruído, aterramento, impedância e interferência."
        },
        {
          "id": "42",
          "name": "Economia, Ética e Gestão da Engenharia",
          "summary": "Custos, sustentabilidade e responsabilidade profissional."
        }
      ],
      "project": "Desenvolver subsistema especificado com métricas de potência, desempenho e área."
    },
    {
      "number": 8,
      "name": "Integração, verificação e fabricação de chips",
      "subjects": [
        {
          "id": "43",
          "name": "Circuitos Integrados de Sinais Mistos",
          "summary": "ADC/DAC, comparadores, PLL, filtros e osciladores."
        },
        {
          "id": "44",
          "name": "Circuitos Integrados de Radiofrequência",
          "summary": "LNA, mixers, osciladores, parâmetros S e RF."
        },
        {
          "id": "45",
          "name": "Nanoeletrônica e Dispositivos Avançados",
          "summary": "FinFET, GAAFET, efeitos quânticos e escalonamento."
        },
        {
          "id": "46",
          "name": "Projeto Físico e Ferramentas EDA",
          "summary": "Layout, placement, routing, DRC, LVS e STA."
        },
        {
          "id": "47",
          "name": "Teste, Encapsulamento e Confiabilidade de CIs",
          "summary": "DFT, BIST, ESD, packaging e envelhecimento."
        },
        {
          "id": "48",
          "name": "Estágio Supervisionado I",
          "summary": "60 h de prática orientada."
        }
      ],
      "project": "Fluxo de projeto digital, síntese, layout e documentação didática."
    },
    {
      "number": 9,
      "name": "Pesquisa e especialização",
      "subjects": [
        {
          "id": "49",
          "name": "Circuitos CMOS de Baixíssimo Consumo",
          "summary": "Subthreshold, leakage e power gating."
        },
        {
          "id": "50",
          "name": "Arquitetura de Sistemas Integrados e Memórias",
          "summary": "SRAM, organização de memória e integração RISC-V/SoC."
        },
        {
          "id": "51",
          "name": "Metodologia Avançada de Pesquisa e Experimentos",
          "summary": "Revisão, hipóteses, estatística e reprodutibilidade."
        },
        {
          "id": "52",
          "name": "Eletiva I — Especialização em Microeletrônica",
          "summary": "Área escolhida segundo trilha de pesquisa."
        },
        {
          "id": "53",
          "name": "Trabalho de Conclusão de Curso I",
          "summary": "Revisão, proposta e plano experimental, 60 h."
        },
        {
          "id": "54",
          "name": "Estágio Supervisionado II",
          "summary": "60 h de prática orientada."
        }
      ],
      "project": "Proposta de pesquisa e divulgação científica com métricas claras."
    },
    {
      "number": 10,
      "name": "Pesquisa e preparação para o mestrado",
      "subjects": [
        {
          "id": "55",
          "name": "EDA Avançada e Verificação de ASICs",
          "summary": "Verificação, coverage, assertions, análise de PPA."
        },
        {
          "id": "56",
          "name": "Tecnologias Emergentes e Integração Heterogênea",
          "summary": "Chiplets, 2.5D/3D e interconexões."
        },
        {
          "id": "57",
          "name": "Eletiva II — Pesquisa Avançada",
          "summary": "Especialização alinhada ao TCC e mestrado."
        },
        {
          "id": "58",
          "name": "Seminários de Pesquisa e Comunicação Científica",
          "summary": "Leitura crítica, revisão por pares e defesa."
        },
        {
          "id": "59",
          "name": "Trabalho de Conclusão de Curso II",
          "summary": "Experimentação, resultados e defesa, 60 h."
        },
        {
          "id": "60",
          "name": "Estágio Supervisionado III",
          "summary": "60 h de experiência orientada."
        }
      ],
      "project": "Finalizar projeto experimental reprodutível, defesa e divulgação dos resultados."
    }
  ]
};
