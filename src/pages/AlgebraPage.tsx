import { useState } from 'react';

const addSubLevels = [
  { q: "x + 3 = 5", a: 2 },
  { q: "x + 7 = 10", a: 3 },
  { q: "x - 4 = 6", a: 10 },
  { q: "x + 5 = 12", a: 7 },
  { q: "x - 2 = 8", a: 10 },
  { q: "x + 8 = 15", a: 7 },
  { q: "x - 5 = 4", a: 9 },
  { q: "x + 9 = 20", a: 11 },
  { q: "x - 7 = 3", a: 10 },
  { q: "x + 6 = 14", a: 8 },
  { q: "x - 9 = 11", a: 20 },
  { q: "x + 10 = 25", a: 15 },
];

const mulDivLevels = [
  { q: "2x = 8", a: 4 },
  { q: "3x = 15", a: 5 },
  { q: "x / 2 = 6", a: 12 },
  { q: "4x = 24", a: 6 },
  { q: "x / 3 = 5", a: 15 },
  { q: "5x = 35", a: 7 },
  { q: "x / 4 = 3", a: 12 },
  { q: "6x = 42", a: 7 },
  { q: "x / 5 = 4", a: 20 },
  { q: "7x = 56", a: 8 },
  { q: "x / 6 = 2", a: 12 },
  { q: "8x = 72", a: 9 },
];

function AlgebraWindow({ levels, title }: { levels: {q: string, a: number}[], title: string }) {
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultColor, setResultColor] = useState('');

  const finished = current >= levels.length;

  const checkAnswer = () => {
    if (finished) return;
    const userAnswer = Number(answer);
    const correct = levels[current].a;

    if (userAnswer === correct) {
      setResultMsg("✅ Correct! Seal is happy 🦭");
      setResultColor("var(--success, green)");

      if (current + 1 < levels.length) {
        setTimeout(() => {
          setCurrent((c: number) => c + 1);
          setAnswer('');
          setResultMsg('');
        }, 1000);
      } else {
        setTimeout(() => {
          setCurrent((c: number) => c + 1);
        }, 1000);
      }
    } else {
      setResultMsg("❌ Try again — think step by step");
      setResultColor("var(--error, red)");
    }
  };

  return (
    <div className="rules-box" style={{ textAlign: 'center', marginTop: '10px', position: 'relative', marginBottom: '40px' }}>
      {finished ? (
         <div style={{ padding: '20px 0' }}>
           <h2 style={{ color: 'var(--success, green)' }}>🎉 {title} Complete!</h2>
           <p style={{ fontSize: '1.1rem' }}>Seal says: You mastered this topic!</p>
           <button 
             onClick={() => setCurrent(0)} 
             style={{ marginTop: '15px', background: 'var(--accent)', padding: '10px 20px', borderRadius: '8px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
           >
             Play Again
           </button>
         </div>
      ) : (
        <>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>{title} Exercises</h3>
          <p id="level" style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '5px' }}>
            Level {current + 1} / {levels.length}
          </p>
          
          <div className="question" style={{ fontSize: '32px', margin: '20px 0', fontFamily: 'monospace' }}>
            {levels[current].q}
          </div>

          <input
            type="number"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            style={{
              padding: '12px',
              fontSize: '1.5rem',
              width: '120px',
              textAlign: 'center',
              borderRadius: '8px',
              border: '2px solid #ddd',
              margin: '0 auto',
              display: 'block'
            }}
            onKeyDown={e => e.key === 'Enter' && checkAnswer()}
          />
          <br />
          <button className="btn-check" onClick={checkAnswer} style={{ marginTop: '5px', maxWidth: '200px', fontSize: '1.1rem' }}>
            Check Answer
          </button>

          <div style={{ minHeight: '30px', marginTop: '15px' }}>
            {resultMsg && (
              <p className="result" style={{ margin: 0, fontWeight: 'bold', color: resultColor, fontSize: '1.1rem' }}>
                {resultMsg}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AlgebraPage() {
  return (
    <section className="page active" id="algebra-page" style={{ paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '2.2rem', marginTop: 0, marginBottom: '30px' }}>🦭 SealMath Algebra</h1>

        {/* Section 1: Addition and Subtraction */}
        <div style={{ textAlign: 'left', background: '#fdfaf6', border: '1px solid #e9d8c4', borderRadius: '12px', padding: '20px', marginBottom: '15px' }}>
          <h2 style={{ fontSize: '1.6rem', color: '#8a4a1a', margin: '0 0 10px 0' }}>Addition & Subtraction</h2>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.5' }}>
            When solving an equation, your goal is to get <strong>x</strong> by itself. You do this by performing the <strong>opposite mathematical operation</strong> on both sides of the equal sign.
          </p>
          <ul style={{ fontSize: '1.05rem', lineHeight: '1.6', marginTop: '15px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '15px' }}>
              <strong>Example 1:</strong> <code>x + 3 = 5</code> <br/>
              Since 3 is being <em>added</em> to x, we do the opposite: <strong>subtract 3</strong> from both sides.<br/>
              <code>x = 5 - 3 ➔ x = 2</code>
            </li>
            <li>
              <strong>Example 2:</strong> <code>x - 4 = 6</code> <br/>
              Since 4 is being <em>subtracted</em> from x, we do the opposite: <strong>add 4</strong> to both sides.<br/>
              <code>x = 6 + 4 ➔ x = 10</code>
            </li>
          </ul>
        </div>
        
        <AlgebraWindow title="Addition & Subtraction" levels={addSubLevels} />


        {/* Section 2: Multiplication and Division */}
        <div style={{ textAlign: 'left', background: '#fdfaf6', border: '1px solid #e9d8c4', borderRadius: '12px', padding: '20px', marginBottom: '15px' }}>
          <h2 style={{ fontSize: '1.6rem', color: '#8a4a1a', margin: '0 0 10px 0' }}>Multiplication & Division</h2>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.5' }}>
            Just like before, we use the <strong>opposite operation</strong> to isolate <strong>x</strong>.
          </p>
          <ul style={{ fontSize: '1.05rem', lineHeight: '1.6', marginTop: '15px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '15px' }}>
              <strong>Example 1:</strong> <code>3x = 12</code> <br/>
              Here, x is <em>multiplied</em> by 3. The opposite is <strong>dividing by 3</strong> on both sides.<br/>
              <code>x = 12 / 3 ➔ x = 4</code>
            </li>
            <li>
              <strong>Example 2:</strong> <code>x / 2 = 5</code> <br/>
              Here, x is <em>divided</em> by 2. The opposite is <strong>multiplying by 2</strong> on both sides.<br/>
              <code>x = 5 * 2 ➔ x = 10</code>
            </li>
          </ul>
        </div>

        <AlgebraWindow title="Multiplication & Division" levels={mulDivLevels} />

      </div>
    </section>
  );
}
