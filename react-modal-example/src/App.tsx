import React, { useState, useEffect } from "react";
import { PaymentModal } from "@patalink/react-payment-modal";
import "@patalink/react-payment-modal/style.css";
import {
  Calendar,
  MapPin,
  Clock,
  Share2,
  Heart,
  Music,
  Users,
  Ticket,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  ShieldCheck,
  CreditCard
} from "lucide-react";

// Types
type TicketType = "vip" | "regular" | "student" | null;
type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

function App() {
  const [selectedTicket, setSelectedTicket] = useState<TicketType>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  // Event Data
  const eventData = {
    name: "SOUL CIPHER",
    subtitle: "A NIGHT THAT FEELS LIKE MUSIC SHOULD",
    date: "APRIL 24, 2026",
    time: "18:00PM - 23:00PM",
    venue: "DEPOT 37",
    location: "Mundi Center, Kigali",
    description: "An immersive experience where soul meets hip-hop in its purest form. Join us for a night of authentic musical expression.",
    price: { vip: 25000, regular: 15000, student: 1000 },
    imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop",
  };

  const getTicketPrice = () => {
    if (!selectedTicket) return 0;
    return eventData.price[selectedTicket];
  };

  const totalPrice = getTicketPrice() * quantity;

  /**
   * HANDLE PAYMENT SUCCESS & POLLING
   */
  const handlePaymentSuccess = (data: any, error: any) => {
    if (error) {
      setPaymentStatus('error');
      setStatusMessage(error.message || 'Payment failed to initiate');
      return;
    }

    if (data?.transactionId) {
      setPaymentStatus('processing');
      setStatusMessage('Verifying your booking...');

      // Start Polling for status
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`https://genuine-choux-bd2e69.netlify.app/api/pay/${data.transactionId}`, {
            headers: { 'Authorization': 'Bearer pt_live_I2IDt-mrT0QNGdhH5UseJzP6rc-dIVGx' }
          });
          const result = await res.json();

          if (result.status === 'success') {
            clearInterval(pollInterval);
            setPaymentStatus('success');
            setStatusMessage(`Ticket confirmed! Order ID: ${data.transactionId}`);
          } else if (result.status === 'failed' || result.status === 'rejected') {
            clearInterval(pollInterval);
            setPaymentStatus('error');
            setStatusMessage(result.reason || 'Payment declined by provider.');
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 4000);

      // Cleanup on unmount
      return () => clearInterval(pollInterval);
    }
  };

  /**
   * HANDLE REDIRECT RETURN (Card Payments)
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackingId = params.get('OrderTrackingId');

    if (trackingId) {
      setPaymentStatus('processing');
      setStatusMessage('Confirming card payment...');

      const cardPoll = setInterval(async () => {
        try {
          const res = await fetch(`https://genuine-choux-bd2e69.netlify.app/api/pay/${trackingId}`, {
            headers: { 'Authorization': 'Bearer pt_live_I2IDt-mrT0QNGdhH5UseJzP6rc-dIVGx' }
          });
          const data = await res.json();

          if (data.status === 'success') {
            clearInterval(cardPoll);
            setPaymentStatus('success');
            setStatusMessage('Card payment verified successfully!');
            window.history.replaceState({}, '', window.location.pathname);
          } else if (data.status === 'failed') {
            clearInterval(cardPoll);
            setPaymentStatus('error');
            setStatusMessage('Card transaction was unsuccessful.');
          }
        } catch (err) {
          console.error('Check failed:', err);
        }
      }, 3000);

      return () => clearInterval(cardPoll);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-purple-500/30">
      {/* Premium Navbar */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Music size={22} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">VIBE<span className="text-purple-500">HUB</span></span>
          </div>
          <div className="hidden md:flex gap-10 text-xs font-bold uppercase tracking-widest text-neutral-500">
            <a href="#" className="hover:text-purple-400 transition-colors">Explore</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Creators</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Help</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative h-[60vh] overflow-hidden">
        <img src={eventData.imageUrl} alt="Hero" className="w-full h-full object-cover brightness-[0.4]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 max-w-7xl mx-auto">
          <div className="flex gap-4 mb-6">
            <span className="px-3 py-1 rounded-full bg-purple-600 text-[10px] font-black uppercase tracking-widest">Live Now</span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">Soul Hip-Hop</span>
          </div>
          <h1 className="text-7xl font-black mb-4 tracking-tighter leading-none">{eventData.name}</h1>
          <p className="text-neutral-400 text-lg max-w-2xl font-medium">{eventData.subtitle}</p>
        </div>
      </div>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-12 py-20 grid lg:grid-cols-3 gap-20">
        <div className="lg:col-span-2 space-y-16">
          {/* Details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-8 bg-white/5 rounded-3xl border border-white/5">
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Date</span>
              <div className="flex items-center gap-2 text-sm font-bold"><Calendar size={14} className="text-purple-500" /> {eventData.date}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Venue</span>
              <div className="flex items-center gap-2 text-sm font-bold"><MapPin size={14} className="text-purple-500" /> {eventData.venue}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Time</span>
              <div className="flex items-center gap-2 text-sm font-bold"><Clock size={14} className="text-purple-500" /> {eventData.time}</div>
            </div>
          </div>

          <section>
            <h2 className="text-2xl font-black mb-6 tracking-tight">The Experience</h2>
            <p className="text-neutral-400 leading-relaxed text-lg">{eventData.description}</p>
          </section>

          <section>
            <h2 className="text-2xl font-black mb-8 tracking-tight">Our Partners</h2>
            <div className="flex gap-12 opacity-30 grayscale hover:grayscale-0 transition-all cursor-pointer">
              <span className="font-black text-2xl tracking-tighter">MUNDI</span>
              <span className="font-black text-2xl tracking-tighter italic">DEPOT.</span>
              <span className="font-black text-2xl tracking-tighter underline">CIPHER</span>
            </div>
          </section>
        </div>

        {/* Ticket Sidebar */}
        <div className="relative">
          <div className="sticky top-32 space-y-8">
            <div className="bg-neutral-900/50 backdrop-blur-2xl p-8 rounded-[40px] border border-white/10 shadow-2xl">
              <h3 className="text-xl font-black mb-8 text-center uppercase tracking-widest text-neutral-400">Secure Checkout</h3>

              <div className="space-y-4">
                {[
                  { id: 'vip', label: 'VIP Access', price: eventData.price.vip, desc: 'Front row + Lounge' },
                  { id: 'regular', label: 'Regular', price: eventData.price.regular, desc: 'General entry' },
                  { id: 'student', label: 'Student', price: eventData.price.student, desc: 'Valid ID required' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t.id as TicketType)}
                    className={`w-full p-6 rounded-3xl border transition-all text-left group ${selectedTicket === t.id
                      ? 'bg-purple-600 border-purple-500 shadow-xl shadow-purple-500/20'
                      : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">{t.label}</span>
                      <span className={`font-black ${selectedTicket === t.id ? 'text-white' : 'text-purple-400'}`}>
                        {t.price.toLocaleString()} RWF
                      </span>
                    </div>
                    <p className={`text-[10px] uppercase font-bold tracking-widest ${selectedTicket === t.id ? 'text-purple-200' : 'text-neutral-500'}`}>
                      {t.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Action */}
              <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Total Price</span>
                    <div className="text-3xl font-black text-white">{totalPrice.toLocaleString()} <span className="text-xs text-neutral-500">RWF</span></div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-[10px] font-black">
                    <ShieldCheck size={12} className="text-green-500" /> SECURE
                  </div>
                </div>

                {paymentStatus === 'idle' ? (
                  <div className="flex justify-center">
                    {totalPrice > 0 && (
                      <PaymentModal
                        apiKey="pt_live_I2IDt-mrT0QNGdhH5UseJzP6rc-dIVGx"
                        encryptionKey="GKRy2jlusn3uAzhrU87qKH9SbQi+26ni8rg7PXnToyg="
                        baseUrl="https://genuine-choux-bd2e69.netlify.app"
                        fixedAmount={totalPrice > 0 ? totalPrice : undefined}
                        customText={totalPrice > 0 ? `Book ${quantity} Ticket(s)` : "Select Ticket Type"}
                        customColor="#9333ea"
                        themeColor="#9333ea"
                        creatorName="VibeHub Events"
                        companyName="Mundi Center"
                        modalBackgroundColor="#0a0a0a"
                        buttonRoundness="rounded-2xl"
                        callbackUrl={window.location.origin}
                        onSuccess={handlePaymentSuccess}
                      />
                    )}
                  </div>
                ) : (
                  <div className={`p-6 rounded-3xl text-center space-y-4 animate-in zoom-in-95 duration-300 ${paymentStatus === 'success' ? 'bg-green-500/10 border border-green-500/20' :
                    paymentStatus === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                      'bg-white/5'
                    }`}>
                    {paymentStatus === 'processing' && <Loader2 size={32} className="mx-auto animate-spin text-purple-500" />}
                    {paymentStatus === 'success' && <CheckCircle size={32} className="mx-auto text-green-500" />}
                    {paymentStatus === 'error' && <AlertCircle size={32} className="mx-auto text-red-500" />}
                    <p className="text-sm font-bold">{statusMessage}</p>
                    {paymentStatus === 'error' && (
                      <button
                        onClick={() => setPaymentStatus('idle')}
                        className="text-xs font-black uppercase text-red-500 hover:underline"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-neutral-600">
              <CreditCard size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Visa • Mastercard • MoMo</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-white/5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-700">© 2026 VibeHub Kigali • All Rights Reserved</p>
      </footer>
    </div>
  );
}

export default App;
