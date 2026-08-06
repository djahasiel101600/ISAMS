import React, { useEffect, useState } from 'react';
import { CheckCircle2, Smartphone, ArrowRight, AlertTriangle, Link2 } from 'lucide-react';
import { api } from '../../services/api';

export const ArMobilePairView: React.FC = () => {
  const [pairCode, setPairCode] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [deviceName, setDeviceName] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pair = params.get('pair');
    if (!pair) {
      setStatus('error');
      setMessage('Missing pairing code. Please open the mobile URL again from the desktop scanner QR code.');
      return;
    }

    setPairCode(pair);
    setStatus('connecting');
    setMessage('Confirming connection with the desktop AR workspace...');

    const userAgent = navigator.userAgent || 'Mobile Scanner';
    api.confirmPairSession(pair, userAgent)
      .then((result) => {
        if (result.connected) {
          setStatus('connected');
          setDeviceName(result.device_name || 'Mobile Scanner');
          setMessage('Mobile device successfully paired. You may now return to the desktop AR workspace.');
        } else {
          setStatus('error');
          setMessage('Pairing failed. Please retry by scanning the QR code again.');
        }
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err?.message || 'Unable to complete pairing.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-slate-950/90 px-8 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Smartphone className="w-7 h-7 text-cyan-400" />
            <div>
              <div className="text-sm uppercase tracking-[0.25em] text-slate-400">AR Mobile Pairing</div>
              <h1 className="text-2xl font-semibold text-white">Connect Your Phone</h1>
            </div>
          </div>
        </div>

        <div className="px-8 py-10 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3">Pairing Code</div>
            <div className="text-5xl font-bold tracking-[0.2em] text-white">{pairCode || '------'}</div>
            <div className="mt-4 text-sm text-slate-400">
              This code establishes a mobile handshake with the desktop AR workspace.
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-3">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</div>
              <div className="flex items-center gap-3">
                {status === 'connected' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : status === 'connecting' ? (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                )}
                <div>
                  <div className="text-sm font-semibold text-white">
                    {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting' : 'Failed'}
                  </div>
                  <div className="text-sm text-slate-400">{message}</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-3">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Mobile Device</div>
              <div className="text-lg font-semibold text-white">{deviceName || 'Awaiting connection...'}</div>
              <div className="text-sm text-slate-400">If the pairing succeeds, this screen confirms the phone is linked.</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-500">Next step</div>
            <div className="text-sm leading-6 text-slate-300">
              If this page connected successfully, return to the desktop AR workspace and continue scanning. If it failed, scan the QR code again from the desktop pairing modal.
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-cyan-300 hover:text-white font-semibold"
            >
              <Link2 className="w-4 h-4" />
              Open desktop workspace
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
