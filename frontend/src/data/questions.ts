import type { QuizQuestion } from '../types/quiz'

export const questions: QuizQuestion[] = [
  {
    id: 1,
    text: 'Qual é a capital do Brasil?',
    options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Belo Horizonte'],
    correctIndex: 2,
  },
  {
    id: 2,
    text: 'Quanto é 7 × 8?',
    options: ['54', '56', '58', '62'],
    correctIndex: 1,
  },
  {
    id: 3,
    text: 'Qual planeta é conhecido como Planeta Vermelho?',
    options: ['Vênus', 'Júpiter', 'Saturno', 'Marte'],
    correctIndex: 3,
  },
  {
    id: 4,
    text: 'Quem escreveu "Dom Casmurro"?',
    options: ['José de Alencar', 'Machado de Assis', 'Clarice Lispector', 'Guimarães Rosa'],
    correctIndex: 1,
  },
  {
    id: 5,
    text: 'Qual é o maior oceano do mundo?',
    options: ['Atlântico', 'Índico', 'Ártico', 'Pacífico'],
    correctIndex: 3,
  },
  {
    id: 6,
    text: 'Em que ano o Brasil foi descoberto?',
    options: ['1492', '1498', '1500', '1502'],
    correctIndex: 2,
  },
  {
    id: 7,
    text: 'Qual é o elemento químico com símbolo "O"?',
    options: ['Ouro', 'Oxigênio', 'Ósmio', 'Óxido'],
    correctIndex: 1,
  },
  {
    id: 8,
    text: 'Quantos lados tem um hexágono?',
    options: ['5', '6', '7', '8'],
    correctIndex: 1,
  },
  {
    id: 9,
    text: 'Qual é o país mais populoso do mundo?',
    options: ['Índia', 'Estados Unidos', 'Brasil', 'China'],
    correctIndex: 0,
  },
  {
    id: 10,
    text: 'Qual é o instrumento de cordas mais comum no choro brasileiro?',
    options: ['Violão', '7-cordas', 'Cavaquinho', 'Bandolim'],
    correctIndex: 2,
  },
]
