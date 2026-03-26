import { useState, ReactNode } from 'react';

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

function AlgebraWindow({ levels, title, exampleContent }: { levels: {q: string, a: number}[], title: string, exampleContent: ReactNode }) {
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showExample, setShowExample] = useState(false);

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
    <div className="rules-box" style={{ flex: 1, textAlign: 'center', marginTop: '0', position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: '0', fontSize: '1.4rem', color: 'var(--dark)' }}>{title}</h3>
        <button 
          onClick={() => setShowExample(!showExample)} 
          style={{ padding: '8px 12px', borderRadius: '6px', background: showExample ? '#dcdde1' : 'var(--accent)', color: showExample ? '#333' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showExample ? 'Hide Examples' : 'Show Examples'}
        </button>
      </div>

      {showExample && (
        <div style={{ textAlign: 'left', background: '#fdfaf6', border: '1px solid #e9d8c4', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          {exampleContent}
        </div>
      )}

      {finished ? (
         <div style={{ padding: '40px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
           <h2 style={{ color: 'var(--success, green)', margin: '0 0 10px' }}>🎉 {title} Complete!</h2>
           <p style={{ fontSize: '1.2rem' }}>Seal says: You mastered this topic!</p>
           <div>
             <button 
               onClick={() => setCurrent(0)} 
               style={{ marginTop: '15px', background: 'var(--accent)', padding: '10px 20px', borderRadius: '8px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
             >
               Play Again
             </button>
           </div>
         </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p id="level" style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '5px' }}>
            Level {current + 1} / {levels.length}
          </p>
          
          <div className="question" style={{ fontSize: '36px', margin: '20px 0', fontFamily: 'var(--mono)', color: 'var(--dark)' }}>
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
              border: '2px solid #ccc',
              margin: '0 auto',
              display: 'block',
              outline: 'none',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
            }}
            onKeyDown={e => e.key === 'Enter' && checkAnswer()}
          />
          <br />
          <div>
            <button className="btn-check" onClick={checkAnswer} style={{ marginTop: '5px', maxWidth: '200px', fontSize: '1.1rem' }}>
              Check Answer
            </button>
          </div>

          <div style={{ minHeight: '30px', marginTop: '15px' }}>
            {resultMsg && (
              <p className="result" style={{ margin: 0, fontWeight: 'bold', color: resultColor, fontSize: '1.1rem' }}>
                {resultMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlgebraPage() {
  const [activeTab, setActiveTab] = useState<'addsub' | 'muldiv'>('addsub');

  const addSubExamples = (
    <>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px', color: '#555' }}>
        When solving an equation, your goal is to get <strong>x</strong> by itself. You do this by performing the <strong>opposite mathematical operation</strong> on both sides of the equal sign.
      </p>
      <ul style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0', paddingLeft: '20px', color: '#555' }}>
        <li style={{ marginBottom: '10px' }}>
          <strong>Example 1:</strong> <code style={{fontFamily: 'var(--mono)'}}>x + 3 = 5</code> <br/>
          Since 3 is being <em>added</em> to x, we do the opposite: <strong>subtract 3</strong> from both sides.<br/>
          <code style={{fontFamily: 'var(--mono)'}}>x = 5 - 3 ➔ x = 2</code>
        </li>
        <li>
          <strong>Example 2:</strong> <code style={{fontFamily: 'var(--mono)'}}>x - 4 = 6</code> <br/>
          Since 4 is being <em>subtracted</em> from x, we do the opposite: <strong>add 4</strong> to both sides.<br/>
          <code style={{fontFamily: 'var(--mono)'}}>x = 6 + 4 ➔ x = 10</code>
        </li>
      </ul>
    </>
  );

  const mulDivExamples = (
    <>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px', color: '#555' }}>
        Just like before, we use the <strong>opposite operation</strong> to isolate <strong>x</strong>.
      </p>
      <ul style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0', paddingLeft: '20px', color: '#555' }}>
        <li style={{ marginBottom: '10px' }}>
          <strong>Example 1:</strong> <code style={{fontFamily: 'var(--mono)'}}>3x = 12</code> <br/>
          Here, x is <em>multiplied</em> by 3. The opposite is <strong>dividing by 3</strong> on both sides.<br/>
          <code style={{fontFamily: 'var(--mono)'}}>x = 12 / 3 ➔ x = 4</code>
        </li>
        <li>
          <strong>Example 2:</strong> <code style={{fontFamily: 'var(--mono)'}}>x / 2 = 5</code> <br/>
          Here, x is <em>divided</em> by 2. The opposite is <strong>multiplying by 2</strong> on both sides.<br/>
          <code style={{fontFamily: 'var(--mono)'}}>x = 5 * 2 ➔ x = 10</code>
        </li>
      </ul>
    </>
  );

  return (
    <section className="page active" id="algebra-page" style={{ paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '800px', width: '90%' }}>
        <h1 style={{ fontSize: '2.2rem', marginTop: 0, marginBottom: '30px' }}>🦭 SealMath Algebra</h1>

        <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
          
          {/* Vertical Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: '1 1 180px', maxWidth: '300px' }}>
            <button 
              onClick={() => setActiveTab('addsub')}
              style={{
                padding: '18px 15px',
                background: activeTab === 'addsub' ? 'var(--accent)' : '#ecf0f1',
                color: activeTab === 'addsub' ? '#fff' : '#2c3e50',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.3rem',
                textAlign: 'center',
                boxShadow: activeTab === 'addsub' ? '0 6px 15px rgba(142, 68, 173, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                transform: activeTab === 'addsub' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              + and -
            </button>
            <button 
              onClick={() => setActiveTab('muldiv')}
              style={{
                padding: '18px 15px',
                background: activeTab === 'muldiv' ? 'var(--accent)' : '#ecf0f1',
                color: activeTab === 'muldiv' ? '#fff' : '#2c3e50',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.3rem',
                textAlign: 'center',
                boxShadow: activeTab === 'muldiv' ? '0 6px 15px rgba(142, 68, 173, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                transform: activeTab === 'muldiv' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              * and /
            </button>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: '3 1 350px', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'addsub' ? (
              <AlgebraWindow title="Addition & Subtraction" levels={addSubLevels} exampleContent={addSubExamples} />
            ) : (
              <AlgebraWindow title="Multiplication & Division" levels={mulDivLevels} exampleContent={mulDivExamples} />
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
