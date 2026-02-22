import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Users, Grip, X, Video, User, Save } from 'lucide-react';
import { sipService } from '../services/sipService';
import { CallState, Customer } from '../types';
import clsx from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

const Softphone: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [number, setNumber] = useState('');
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const { t, isRTL } = useLanguage();
  const { logCallOutcome, customers, updateCustomer } = useData();

  // Active Call Customer Data
  const [identifiedCustomer, setIdentifiedCustomer] = useState<Customer | null>(null);
  const [callNote, setCallNote] = useState('');

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let lastState = CallState.IDLE;
    const unsubscribe = sipService.subscribe((newState) => {
      // Log logic when call ends
      if ((lastState === CallState.CONNECTED) && newState === CallState.IDLE) {
          const activeNum = sipService.getActiveNumber();
          if (activeNum) logCallOutcome(activeNum, 'Answered');
      } else if ((lastState === CallState.RINGING) && newState === CallState.IDLE) {
           const activeNum = sipService.getActiveNumber();
           if (activeNum) logCallOutcome(activeNum, 'No Answer');
      }

      // Reset on new call
      if (newState === CallState.CONNECTING || newState === CallState.RINGING) {
          const activeNum = sipService.getActiveNumber();
          if (activeNum) {
              setNumber(activeNum);
              // Identify customer
              const match = customers.find(c => c.phone === activeNum);
              setIdentifiedCustomer(match || null);
              setCallNote(match?.notes || '');
          }
      }

      lastState = newState;
      setCallState(newState);

      if (newState === CallState.RINGING || newState === CallState.CONNECTED || newState === CallState.CONNECTING) {
        setIsOpen(true);
      }
      if (newState === CallState.CONNECTED) {
          startTimer();
      } else {
          stopTimer();
          if (newState === CallState.IDLE) {
              setDuration(0);
              // Small delay before clearing identifying data
              setTimeout(() => {
                 setIdentifiedCustomer(null);
                 setCallNote('');
              }, 2000);
          }
      }
    });
    return () => {
        unsubscribe();
        stopTimer();
    };
  }, [logCallOutcome, customers]);

  const startTimer = () => {
      if(timerRef.current) return;
      timerRef.current = window.setInterval(() => {
          setDuration(d => d + 1);
      }, 1000);
  };

  const stopTimer = () => {
      if(timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
      }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCall = () => {
    if (number.length > 2) {
      sipService.makeCall(number);
    }
  };

  const handleHangup = () => {
    handleSaveNote(); // Auto-save note on hangup
    sipService.hangup();
  };
  
  const handleAnswer = () => {
      sipService.answer();
  };

  const handleKeypad = (digit: string) => {
    setNumber(prev => prev + digit);
  };

  const handleSaveNote = () => {
      if (identifiedCustomer && callNote !== identifiedCustomer.notes) {
          updateCustomer(identifiedCustomer.id, { notes: callNote });
      }
  };

  if (!isOpen && callState === CallState.IDLE) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={clsx("fixed bottom-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg z-50 transition-all transform hover:scale-105", isRTL ? "left-6" : "right-6")}
      >
        <Phone className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={clsx("fixed bottom-6 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col font-sans animate-fade-in-up", isRTL ? "left-6" : "right-6")}>
      {/* Header */}
      <div className={clsx("p-4 flex justify-between items-center text-white", 
        callState === CallState.CONNECTED ? "bg-green-600" : 
        callState === CallState.RINGING ? "bg-indigo-600 animate-pulse" : "bg-slate-800"
      )}>
        <div className="flex items-center gap-2">
            <span className="font-semibold">{callState === CallState.IDLE ? t('phone') : callState}</span>
            {callState === CallState.CONNECTED && <span className="text-sm opacity-90">{formatDuration(duration)}</span>}
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Customer Info / Number Display */}
      <div className="bg-slate-50 p-6 flex flex-col items-center justify-center border-b border-slate-100">
        {identifiedCustomer ? (
            <div className="text-center mb-2 animate-fade-in">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900">{identifiedCustomer.name}</h3>
                <p className="text-xs text-slate-500">{identifiedCustomer.operator}</p>
            </div>
        ) : (
            callState !== CallState.IDLE && (
                <div className="text-xs text-slate-400 mb-2">{t('unknownCustomer')}</div>
            )
        )}
        <input 
          type="text" 
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder={t('enterNumber')}
          className="text-2xl text-center bg-transparent outline-none w-full font-bold text-slate-800 mb-2"
          readOnly={callState !== CallState.IDLE}
          dir="ltr"
        />
        <div className="text-sm text-slate-500">
             {callState === CallState.CONNECTED ? t('hdVoiceActive') : t('readyToCall')}
        </div>
      </div>

      {/* Active Call Controls / Notes */}
      {callState !== CallState.IDLE ? (
        <div className="p-4 bg-white">
            {/* Note Taking Area */}
            {identifiedCustomer && (
                <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('callNotes')}</label>
                    <textarea 
                        className="w-full h-20 p-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                        value={callNote}
                        onChange={(e) => setCallNote(e.target.value)}
                        placeholder="Type notes here..."
                    />
                    <div className="flex justify-end mt-1">
                        <button onClick={handleSaveNote} className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:text-indigo-800">
                            <Save className="w-3 h-3" /> {t('saveNotes')}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 gap-4 mt-2">
                 {callState === CallState.RINGING && (
                     <>
                        <button onClick={handleAnswer} className="col-start-1 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 flex justify-center items-center">
                            <Phone className="w-6 h-6" />
                        </button>
                        <div className="col-start-3 flex justify-center items-center"></div>
                     </>
                 )}
                
                <button onClick={() => setIsMuted(!isMuted)} className={clsx("rounded-full p-4 flex justify-center items-center transition", isMuted ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-900 hover:bg-slate-200")}>
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-full p-4 flex justify-center items-center">
                    <Users className="w-6 h-6" />
                </button>
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-full p-4 flex justify-center items-center">
                    <Video className="w-6 h-6" />
                </button>
                
                <button onClick={handleHangup} className="col-span-3 mt-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-3 flex justify-center items-center gap-2 font-medium shadow-md transition-transform active:scale-95">
                    <PhoneOff className="w-5 h-5" /> {t('endCall')}
                </button>
            </div>
        </div>
      ) : (
        /* Keypad */
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleKeypad(digit)}
                className="h-12 w-full rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-lg transition border border-slate-200"
              >
                {digit}
              </button>
            ))}
          </div>
          <button
            onClick={handleCall}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
          >
            <Phone className="w-5 h-5" /> {t('call')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Softphone;