import { useState, useEffect, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useI18n } from '../i18n/useI18n';

type Problem = { q: string, a: number };

function generateAddSubProblem(): Problem {
  const isAdd = Math.random() > 0.5;
  const x = Math.floor(Math.random() * 20) + 1;
  const a = Math.floor(Math.random() * 20) + 1;
  if (isAdd) {
    return { q: `x + ${a} = ${x + a}`, a: x };
  } else {
    const newX = x + a;
    return { q: `x - ${a} = ${newX - a}`, a: newX };
  }
}

function generateMulDivProblem(): Problem {
  const isMul = Math.random() > 0.5;
  const a = Math.floor(Math.random() * 9) + 2; 
  if (isMul) {
    const x = Math.floor(Math.random() * 12) + 1;
    return { q: `${a}x = ${a * x}`, a: x };
  } else {
    const b = Math.floor(Math.random() * 12) + 1;
    const x = a * b;
    return { q: `x / ${a} = ${b}`, a: x };
  }
}

function AlgebraWindow({ 
  generateProblem, 
  title, 
  exampleContent,
  t,
  id
}: { 
  generateProblem: () => Problem, 
  title: string, 
  exampleContent: ReactNode,
  t: any,
  id: string
}) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [solvedCount, setSolvedCount] = useState(() => {
    return parseInt(localStorage.getItem(`algebra_solved_${id}`) || '0', 10);
  });
  const [answer, setAnswer] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    setProblem(generateProblem());
  }, [generateProblem]);

  useEffect(() => {
    const handleClear = () => setSolvedCount(0);
    window.addEventListener('clear-history', handleClear);
    return () => window.removeEventListener('clear-history', handleClear);
  }, []);

  const checkAnswer = () => {
    if (!problem) return;
    const userAnswer = Number(answer);
    if (answer.trim() === '') return;

    if (userAnswer === problem.a) {
      setResultMsg(t('algebra_correct'));
      setResultColor("var(--success, green)");

      setTimeout(() => {
        setSolvedCount(c => {
          const next = c + 1;
          localStorage.setItem(`algebra_solved_${id}`, String(next));
          return next;
        });
        setProblem(generateProblem());
        setAnswer('');
        setResultMsg('');
      }, 1000);
    } else {
      setResultMsg(t('algebra_incorrect'));
      setResultColor("var(--error, red)");
    }
  };

  if (!problem) return null;

  return (
    <div className="rules-box" style={{ flex: 1, textAlign: 'center', marginTop: '0', position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: '0', fontSize: '1.4rem', color: 'var(--dark)' }}>{title}</h3>
        <button 
          onClick={() => setShowExample(!showExample)} 
          style={{ padding: '8px 12px', borderRadius: '6px', background: showExample ? '#dcdde1' : 'var(--accent)', color: showExample ? '#333' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showExample ? t('algebra_hide_examples') : t('algebra_show_examples')}
        </button>
      </div>

      {showExample && (
        <div style={{ textAlign: 'start', background: '#fdfaf6', border: '1px solid #e9d8c4', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          {exampleContent}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p id="level" style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '5px' }}>
          {t('algebra_level').replace('{count}', String(solvedCount))}
        </p>
        
        <div className="question" style={{ fontSize: '36px', margin: '20px 0', fontFamily: 'var(--mono)', color: 'var(--dark)', direction: 'ltr' }}>
          {problem.q}
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
            {t('algebra_check_ans')}
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
    </div>
  );
}

type TwoStepProblem = {
  q: string;
  step1Prefix: string;
  step1Ans: number;
  step2Prefix: string;
  step2Ans: number;
};

function generateTwoStepProblem(): TwoStepProblem {
  const isAdd = Math.random() > 0.5;
  const a = Math.floor(Math.random() * 8) + 2; 
  const b = Math.floor(Math.random() * 20) + 1;

  if (!isAdd) {
    const c = Math.floor(Math.random() * 30) + 5; 
    const step1Ans = c + b;
    const x = step1Ans / a;
    return {
      q: `${a}x - ${b} = ${c}`,
      step1Prefix: `${a}x =`,
      step1Ans: step1Ans,
      step2Prefix: `x =`,
      step2Ans: x
    };
  } else {
    const c = b + Math.floor(Math.random() * 30) + 5; 
    const step1Ans = c - b;
    const x = step1Ans / a;
    return {
      q: `${a}x + ${b} = ${c}`,
      step1Prefix: `${a}x =`,
      step1Ans: step1Ans,
      step2Prefix: `x =`,
      step2Ans: x
    };
  }
}

function TwoStepAlgebraWindow({ 
  generateProblem, 
  title, 
  exampleContent,
  t,
  id
}: { 
  generateProblem: () => TwoStepProblem, 
  title: string, 
  exampleContent: ReactNode,
  t: any,
  id: string
}) {
  const [problem, setProblem] = useState<TwoStepProblem | null>(null);
  const [solvedCount, setSolvedCount] = useState(() => {
    return parseInt(localStorage.getItem(`algebra_solved_${id}`) || '0', 10);
  });
  const [ans1, setAns1] = useState('');
  const [ans2, setAns2] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    setProblem(generateProblem());
  }, [generateProblem]);

  useEffect(() => {
    const handleClear = () => setSolvedCount(0);
    window.addEventListener('clear-history', handleClear);
    return () => window.removeEventListener('clear-history', handleClear);
  }, []);

  const checkBothAnswers = () => {
    if (!problem) return;
    const v1 = Number(ans1);
    const v2 = Number(ans2);
    if (ans1.trim() === '' || ans2.trim() === '') return;

    const isPhase1Correct = v1 === problem.step1Ans;
    const expectedRounded2 = Math.round((problem.step2Ans + Number.EPSILON) * 100) / 100;
    const isPhase2Correct = (v2 === expectedRounded2) || (v2 === problem.step2Ans);

    if (isPhase1Correct && isPhase2Correct) {
      setResultMsg(t('algebra_correct'));
      setResultColor("var(--success, green)");
      setTimeout(() => {
        setSolvedCount(c => {
          const next = c + 1;
          localStorage.setItem(`algebra_solved_${id}`, String(next));
          return next;
        });
        setProblem(generateProblem());
        setAns1('');
        setAns2('');
        setResultMsg('');
      }, 1000);
    } else if (!isPhase1Correct) {
      setResultMsg(t('algebra_twostep_err1') || t('algebra_incorrect'));
      setResultColor("var(--error, red)");
    } else {
      setResultMsg(t('algebra_twostep_err2') || t('algebra_incorrect'));
      setResultColor("var(--error, red)");
    }
  };

  const showSolution = () => {
    if (!problem) return;
    setAns1(String(problem.step1Ans));
    setAns2(String(Math.round(problem.step2Ans * 100) / 100));
    setResultMsg('');
  };

  if (!problem) return null;

  return (
    <div className="rules-box" style={{ flex: 1, textAlign: 'center', marginTop: '0', position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: '0', fontSize: '1.4rem', color: 'var(--dark)' }}>{title}</h3>
        <button 
          onClick={() => setShowExample(!showExample)} 
          style={{ padding: '8px 12px', borderRadius: '6px', background: showExample ? '#dcdde1' : 'var(--accent)', color: showExample ? '#333' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showExample ? t('algebra_hide_examples') : t('algebra_show_examples')}
        </button>
      </div>

      {showExample && (
        <div style={{ textAlign: 'start', background: '#fdfaf6', border: '1px solid #e9d8c4', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          {exampleContent}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <p id="level" style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '5px' }}>
          {t('algebra_level').replace('{count}', String(solvedCount))}
        </p>
        
        <div className="question" style={{ fontSize: '36px', margin: '20px 0', fontFamily: 'var(--mono)', color: 'var(--dark)', direction: 'ltr' }}>
          {problem.q}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', direction: 'ltr', fontFamily: 'var(--mono)', fontSize: '1.5rem' }}>
          <span style={{ width: '80px', textAlign: 'right' }}>{problem.step1Prefix}</span>
          <input
            type="number" step="any" value={ans1} onChange={e => setAns1(e.target.value)}
            style={{ padding: '8px', fontSize: '1.4rem', width: '100px', textAlign: 'center', borderRadius: '6px', border: '2px solid #ccc' }}
            onKeyDown={e => e.key === 'Enter' && checkBothAnswers()}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', direction: 'ltr', fontFamily: 'var(--mono)', fontSize: '1.5rem' }}>
          <span style={{ width: '80px', textAlign: 'right' }}>{problem.step2Prefix}</span>
          <input
            type="number" step="any" value={ans2} onChange={e => setAns2(e.target.value)}
            style={{ padding: '8px', fontSize: '1.4rem', width: '100px', textAlign: 'center', borderRadius: '6px', border: '2px solid #ccc' }}
            onKeyDown={e => e.key === 'Enter' && checkBothAnswers()}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn-check" onClick={checkBothAnswers} style={{ maxWidth: '160px', fontSize: '1.1rem' }}>
            {t('algebra_check_ans')}
          </button>
          <button className="btn-check" onClick={showSolution} style={{ maxWidth: '160px', fontSize: '1.1rem', background: '#95a5a6' }}>
            {t('btn_show_sol')}
          </button>
        </div>

        <div style={{ minHeight: '30px', marginTop: '15px' }}>
          {resultMsg && (
            <p className="result" style={{ margin: 0, fontWeight: 'bold', color: resultColor, fontSize: '1rem' }}>
              {resultMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

type CombiningLikeTermsProblem = {
  q: string;
  a: number;
  b: number;
  isAdd: boolean;
  variable: string;
};

function generateCombiningLikeTermsProblem(): CombiningLikeTermsProblem {
  const isAdd = Math.random() > 0.5;
  const a = Math.floor(Math.random() * 12) + 2; 
  const b = Math.floor(Math.random() * 12) + 2;
  const variables = ['x', 'y', 't', 'd'];
  const variable = variables[Math.floor(Math.random() * variables.length)];
  return {
    q: `${a}${variable} ${isAdd ? '+' : '-'} ${b}${variable}`,
    a,
    b,
    isAdd,
    variable
  };
}

function CombiningLikeTermsWindow({ 
  generateProblem, 
  title, 
  exampleContent,
  t,
  id
}: { 
  generateProblem: () => CombiningLikeTermsProblem, 
  title: string, 
  exampleContent: ReactNode,
  t: any,
  id: string
}) {
  const [problem, setProblem] = useState<CombiningLikeTermsProblem | null>(null);
  const [solvedCount, setSolvedCount] = useState(() => {
    return parseInt(localStorage.getItem(`algebra_solved_${id}`) || '0', 10);
  });
  const [ans1, setAns1] = useState('');
  const [ans2, setAns2] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    setProblem(generateProblem());
  }, [generateProblem]);

  useEffect(() => {
    const handleClear = () => setSolvedCount(0);
    window.addEventListener('clear-history', handleClear);
    return () => window.removeEventListener('clear-history', handleClear);
  }, []);

  const checkBothAnswers = () => {
    if (!problem) return;
    if (ans1.trim() === '' || ans2.trim() === '') return;

    // Normalize ans1: Step 1 expects "variable(a+b)" or "(a+b)variable" etc.
    const v = problem.variable;
    const a = problem.a;
    const b = problem.b;
    const op = problem.isAdd ? '+' : '-';
    
    const normalizedAns1 = ans1.replace(/\s+/g, '').toLowerCase();
    
    const validFormats = [
      `${v}(${a}${op}${b})`,
      `${v}(${b}${op}${a})`,
      `(${a}${op}${b})${v}`,
      `(${b}${op}${a})${v}`
    ];

    const isStep1Correct = validFormats.includes(normalizedAns1);
    
    // Step 2: Full simplified expression like "13x"
    const normalizedAns2 = ans2.replace(/\s+/g, '').toLowerCase();
    const resultNum = problem.isAdd ? (a + b) : (a - b);
    const expectedAns2 = `${resultNum}${v}`;
    const isStep2Correct = normalizedAns2 === expectedAns2;

    if (isStep1Correct && isStep2Correct) {
      setResultMsg(t('algebra_correct'));
      setResultColor("var(--success, green)");
      setTimeout(() => {
        setSolvedCount(c => {
          const next = c + 1;
          localStorage.setItem(`algebra_solved_${id}`, String(next));
          return next;
        });
        setProblem(generateProblem());
        setAns1('');
        setAns2('');
        setResultMsg('');
      }, 1000);
    } else if (!isStep1Correct) {
      setResultMsg(t('algebra_combinelike_err1'));
      setResultColor("var(--error, red)");
    } else {
      setResultMsg(t('algebra_combinelike_err2'));
      setResultColor("var(--error, red)");
    }
  };

  const showSolution = () => {
    if (!problem) return;
    setAns1(`${problem.variable}(${problem.a} ${problem.isAdd ? '+' : '-'} ${problem.b})`);
    setAns2(`${problem.isAdd ? (problem.a + problem.b) : (problem.a - problem.b)}${problem.variable}`);
    setResultMsg('');
  };

  if (!problem) return null;

  return (
    <div className="rules-box" style={{ flex: 1, textAlign: 'center', marginTop: '0', position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: '0', fontSize: '1.4rem', color: 'var(--dark)' }}>{title}</h3>
        <button 
          onClick={() => setShowExample(!showExample)} 
          style={{ padding: '8px 12px', borderRadius: '6px', background: showExample ? '#dcdde1' : 'var(--accent)', color: showExample ? '#333' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showExample ? t('algebra_hide_examples') : t('algebra_show_examples')}
        </button>
      </div>

      {showExample && (
        <div style={{ textAlign: 'start', background: '#fdfaf6', border: '1px solid #e9d8c4', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          {exampleContent}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <p id="level" style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '5px' }}>
          {t('algebra_level').replace('{count}', String(solvedCount))}
        </p>
        
        <div className="question" style={{ fontSize: '36px', margin: '20px 0', fontFamily: 'var(--mono)', color: 'var(--dark)', direction: 'ltr' }}>
          {problem.q}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', direction: 'ltr', fontFamily: 'var(--mono)', fontSize: '1.5rem' }}>
          <input
            type="text" value={ans1} onChange={e => setAns1(e.target.value)}
            placeholder={`${problem.variable}(a + b)`}
            style={{ padding: '8px', fontSize: '1.4rem', width: '200px', textAlign: 'center', borderRadius: '6px', border: '2px solid #ccc' }}
            onKeyDown={e => e.key === 'Enter' && checkBothAnswers()}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', direction: 'ltr', fontFamily: 'var(--mono)', fontSize: '1.5rem' }}>
          <input
            type="text" value={ans2} onChange={e => setAns2(e.target.value)}
            placeholder={`result${problem.variable}`}
            style={{ padding: '8px', fontSize: '1.4rem', width: '200px', textAlign: 'center', borderRadius: '6px', border: '2px solid #ccc' }}
            onKeyDown={e => e.key === 'Enter' && checkBothAnswers()}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn-check" onClick={checkBothAnswers} style={{ maxWidth: '160px', fontSize: '1.1rem' }}>
            {t('algebra_check_ans')}
          </button>
          <button className="btn-check" onClick={showSolution} style={{ maxWidth: '160px', fontSize: '1.1rem', background: '#95a5a6' }}>
            {t('btn_show_sol')}
          </button>
        </div>

        <div style={{ minHeight: '30px', marginTop: '15px' }}>
          {resultMsg && (
            <p className="result" style={{ margin: 0, fontWeight: 'bold', color: resultColor, fontSize: '1rem' }}>
              {resultMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AlgebraPage() {
  const [activeTab, setActiveTab] = useState<'addsub' | 'muldiv' | 'twostep' | 'combinelike'>(() => {
    return (localStorage.getItem('algebraActiveTab') as any) || 'addsub';
  });
  const { lang, t } = useI18n();

  useEffect(() => {
    localStorage.setItem('algebraActiveTab', activeTab);
  }, [activeTab]);

  const addSubExamples = (
    <>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('algebra_addsub_desc') }} />
      <ul style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0', paddingInlineStart: '20px', color: '#555' }}>
        <li style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: t('algebra_addsub_ex1') }} />
        <li dangerouslySetInnerHTML={{ __html: t('algebra_addsub_ex2') }} />
      </ul>
    </>
  );

  const mulDivExamples = (
    <>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('algebra_muldiv_desc') }} />
      <ul style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0', paddingInlineStart: '20px', color: '#555' }}>
        <li style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: t('algebra_muldiv_ex1') }} />
        <li dangerouslySetInnerHTML={{ __html: t('algebra_muldiv_ex2') }} />
      </ul>
    </>
  );

  const twoStepExamples = (
    <>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('algebra_twostep_desc') }} />
      <div style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('algebra_twostep_ex1') }} />
    </>
  );

  const combineLikeExamples = (
    <>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('algebra_combinelike_desc') }} />
      <ul style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0', paddingInlineStart: '20px', color: '#555' }}>
        <li style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: t('algebra_combinelike_ex1') }} />
      </ul>
    </>
  );

  return (
    <section className="page active" id="algebra-page" style={{ paddingBottom: '60px' }}>
      <Helmet>
        <html lang={lang} dir={lang === 'he' ? 'rtl' : 'ltr'} />
        <title>{t('meta_title_algebra')}</title>
        <link rel="canonical" href="https://sealmath.com/algebra" />
        <link rel="alternate" hrefLang="he" href="https://sealmath.com/algebra?lang=he" />
        <link rel="alternate" hrefLang="en" href="https://sealmath.com/algebra" />
        <link rel="alternate" hrefLang="nl" href="https://sealmath.com/algebra?lang=nl" />
        <link rel="alternate" hrefLang="x-default" href="https://sealmath.com/algebra" />
        <meta name="description" content={t('meta_description_algebra')} />
      </Helmet>
      <div className="container" style={{ maxWidth: '800px', width: '90%' }}>
        <h1 style={{ fontSize: '2.2rem', marginTop: 0, marginBottom: '30px', textAlign: 'center' }}>{t('algebra_title')}</h1>

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
                fontSize: '1.1rem',
                textAlign: 'center',
                boxShadow: activeTab === 'addsub' ? '0 6px 15px rgba(142, 68, 173, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                transform: activeTab === 'addsub' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {t('algebra_btn_addsub')}
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
                fontSize: '1.1rem',
                textAlign: 'center',
                boxShadow: activeTab === 'muldiv' ? '0 6px 15px rgba(142, 68, 173, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                transform: activeTab === 'muldiv' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {t('algebra_btn_muldiv')}
            </button>
            <button 
              onClick={() => setActiveTab('twostep')}
              style={{
                padding: '18px 15px',
                background: activeTab === 'twostep' ? 'var(--accent)' : '#ecf0f1',
                color: activeTab === 'twostep' ? '#fff' : '#2c3e50',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textAlign: 'center',
                boxShadow: activeTab === 'twostep' ? '0 6px 15px rgba(142, 68, 173, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                transform: activeTab === 'twostep' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {t('algebra_btn_twostep')}
            </button>
            <button 
              onClick={() => setActiveTab('combinelike')}
              style={{
                padding: '18px 15px',
                background: activeTab === 'combinelike' ? 'var(--accent)' : '#ecf0f1',
                color: activeTab === 'combinelike' ? '#fff' : '#2c3e50',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textAlign: 'center',
                boxShadow: activeTab === 'combinelike' ? '0 6px 15px rgba(142, 68, 173, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                transform: activeTab === 'combinelike' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {t('algebra_btn_combinelike')}
            </button>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: '3 1 350px', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'addsub' && (
              <AlgebraWindow 
                id="addsub"
                title={t('algebra_btn_addsub')} 
                generateProblem={generateAddSubProblem} 
                exampleContent={addSubExamples}
                t={t}
              />
            )}
            {activeTab === 'muldiv' && (
              <AlgebraWindow 
                id="muldiv"
                title={t('algebra_btn_muldiv')} 
                generateProblem={generateMulDivProblem} 
                exampleContent={mulDivExamples}
                t={t}
              />
            )}
            {activeTab === 'twostep' && (
              <TwoStepAlgebraWindow 
                id="twostep"
                title={t('algebra_btn_twostep')} 
                generateProblem={generateTwoStepProblem} 
                exampleContent={twoStepExamples}
                t={t}
              />
            )}
            {activeTab === 'combinelike' && (
              <CombiningLikeTermsWindow 
                id="combinelike"
                title={t('algebra_btn_combinelike')} 
                generateProblem={generateCombiningLikeTermsProblem} 
                exampleContent={combineLikeExamples}
                t={t}
              />
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
