import { useEffect, useState } from 'react';
import { Brain, CheckCircle2, Lightbulb, Play, RotateCcw, Target, Trophy, XCircle } from 'lucide-react';
import {
  createChallenge,
  EMPTY_CHALLENGE_PROGRESS,
  normalizeChallengeProgress,
  recordChallengeAttempt,
} from '../logic/challenges.js';

const STORAGE_KEY = 'dsa-challenge-progress-v1';

function loadProgress() {
  try {
    return normalizeChallengeProgress(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return normalizeChallengeProgress(EMPTY_CHALLENGE_PROGRESS);
  }
}

function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // El desafío sigue funcionando aunque el navegador bloquee localStorage.
  }
}

export default function ChallengePanel({ algorithm, values, playing, scenarioKey = 0, onVerify }) {
  const [progress, setProgress] = useState(loadProgress);
  const [challenge, setChallenge] = useState(() => createChallenge(
    algorithm,
    values,
    loadProgress().byAlgorithm[algorithm.id]?.attempts ?? 0,
  ));
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [verified, setVerified] = useState(false);

  const resetQuestionState = () => {
    setSelectedChoice(null);
    setAnswered(false);
    setUsedHint(false);
    setVerified(false);
  };

  const prepareChallenge = (nextValues = values) => {
    const latestProgress = loadProgress();
    const attempt = latestProgress.byAlgorithm[algorithm.id]?.attempts ?? 0;
    setProgress(latestProgress);
    setChallenge(createChallenge(algorithm, nextValues, attempt));
    resetQuestionState();
  };

  useEffect(() => {
    prepareChallenge(values);
  }, [algorithm.id, scenarioKey]);

  if (!challenge) return null;

  const topicProgress = progress.byAlgorithm[algorithm.id] ?? { attempts: 0, correct: 0 };
  const successRate = progress.attempts ? Math.round(progress.correct / progress.attempts * 100) : 0;
  const selectedIsCorrect = selectedChoice === challenge.correctChoiceId;

  const answer = choiceId => {
    if (answered) return;
    const isCorrect = choiceId === challenge.correctChoiceId;
    const nextProgress = recordChallengeAttempt(progress, algorithm.id, isCorrect, usedHint);
    setSelectedChoice(choiceId);
    setAnswered(true);
    setProgress(nextProgress);
    saveProgress(nextProgress);
  };

  const verify = () => {
    onVerify(challenge.action.id, challenge.action.fields);
    setVerified(true);
  };

  return <section className="challenge-panel" aria-labelledby="challenge-title">
    <header className="challenge-header">
      <div className="challenge-title">
        <span><Brain size={18}/></span>
        <div><small>Modo desafío</small><h3 id="challenge-title">Predice antes de ejecutar</h3></div>
      </div>
      <div className="challenge-progress" aria-label={`${progress.correct} aciertos de ${progress.attempts} intentos`}>
        <Trophy size={15}/><strong>{progress.correct}/{progress.attempts}</strong><span>{successRate}%</span>
      </div>
    </header>

    <div className="challenge-question">
      <Target size={17}/><p>{challenge.question}</p>
    </div>

    <div className="challenge-options" role="group" aria-label="Posibles respuestas">
      {challenge.options.map(option => {
        const isSelected = selectedChoice === option.id;
        const isCorrect = option.id === challenge.correctChoiceId;
        const resultClass = answered && isCorrect
          ? 'correct-answer'
          : answered && isSelected ? 'wrong-answer' : '';
        return <button
          type="button"
          key={option.id}
          className={`${isSelected ? 'selected' : ''} ${resultClass}`.trim()}
          aria-pressed={isSelected}
          disabled={answered}
          onClick={() => answer(option.id)}
        >
          <span>{option.label}</span>
          {answered && isCorrect && <CheckCircle2 size={16}/>}
          {answered && isSelected && !isCorrect && <XCircle size={16}/>}
        </button>;
      })}
    </div>

    {!answered && <div className="challenge-hint-row">
      <button type="button" className="challenge-hint-button" onClick={() => setUsedHint(true)} disabled={usedHint}>
        <Lightbulb size={15}/>{usedHint ? 'Pista mostrada' : 'Necesito una pista'}
      </button>
      <span>Tema: {topicProgress.correct} aciertos en {topicProgress.attempts} intentos</span>
    </div>}

    {usedHint && !answered && <p className="challenge-hint" role="status"><Lightbulb size={15}/>{challenge.hint}</p>}

    {answered && <div className={`challenge-feedback ${selectedIsCorrect ? 'success' : 'error'}`} role="status" aria-live="polite">
      {selectedIsCorrect ? <CheckCircle2 size={19}/> : <XCircle size={19}/>}
      <div><strong>{selectedIsCorrect ? '¡Buena predicción!' : 'Todavía no, revisemos la idea'}</strong><p>{challenge.explanation}</p></div>
    </div>}

    {answered && <div className="challenge-actions">
      <button type="button" className="challenge-verify" onClick={verify} disabled={playing || verified}>
        <Play size={15}/>{verified ? 'Animación iniciada' : 'Comprobar con la animación'}
      </button>
      <button type="button" onClick={() => prepareChallenge(values)} disabled={playing}>
        <RotateCcw size={15}/>Otro desafío
      </button>
    </div>}
  </section>;
}
