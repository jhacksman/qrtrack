import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QrCode, BarChart3, Zap, Shield, ArrowRight, LogOut, Plus, Trash2, Eye, ExternalLink, Copy, Check } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface User {
  id: number;
  email: string;
  subscription_status: string;
  created_at: string;
}

interface QRCode {
  id: number;
  name: string;
  target_url: string;
  short_code: string;
  color: string;
  bg_color: string;
  created_at: string;
  scan_count: number;
}

interface Analytics {
  total_scans: number;
  scans_today: number;
  scans_this_week: number;
  scans_this_month: number;
  top_countries: { country: string; count: number }[];
  top_devices: { device: string; count: number }[];
  scans_by_day: { date: string; count: number }[];
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        logout();
      }
    } catch {
      logout();
    }
  };

  useEffect(() => {
    if (token) refreshUser();
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
}

function LandingPage() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <QrCode className="h-8 w-8 text-blue-500" />
          <span className="text-2xl font-bold text-white">QRTrack</span>
        </div>
        <div className="flex gap-4">
          {token ? (
            <Link to="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-white">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="container mx-auto px-6 py-20 text-center">
        <Badge className="mb-4" variant="secondary">Track Every Scan</Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          QR Codes with<br />
          <span className="text-blue-500">Powerful Analytics</span>
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Create dynamic QR codes and track every scan. Know who scans your codes, when, and from where.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Start Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/pricing">
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <QrCode className="h-12 w-12 text-blue-500 mb-4" />
              <CardTitle className="text-white">Dynamic QR Codes</CardTitle>
              <CardDescription className="text-slate-400">
                Create customizable QR codes that redirect to any URL. Change destinations anytime.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-green-500 mb-4" />
              <CardTitle className="text-white">Real-time Analytics</CardTitle>
              <CardDescription className="text-slate-400">
                Track scans in real-time. See device types, locations, and scan patterns.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-500 mb-4" />
              <CardTitle className="text-white">Secure & Reliable</CardTitle>
              <CardDescription className="text-slate-400">
                Enterprise-grade infrastructure ensures your QR codes work 24/7.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section id="pricing" className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Simple Pricing</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Free</CardTitle>
              <div className="text-4xl font-bold text-white">$0<span className="text-lg font-normal text-slate-400">/month</span></div>
            </CardHeader>
            <CardContent className="text-slate-300">
              <ul className="space-y-2">
                <li>5 QR codes</li>
                <li>Basic scan count</li>
                <li>Standard support</li>
              </ul>
              <Link to="/register">
                <Button className="w-full mt-6" variant="outline">Get Started</Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-blue-600 border-blue-500 relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
            <CardHeader>
              <CardTitle className="text-white">Pro</CardTitle>
              <div className="text-4xl font-bold text-white">$9.99<span className="text-lg font-normal text-blue-200">/month</span></div>
            </CardHeader>
            <CardContent className="text-blue-100">
              <ul className="space-y-2">
                <li>Unlimited QR codes</li>
                <li>Full analytics (location, device, time)</li>
                <li>Custom colors</li>
                <li>Priority support</li>
                <li>API access</li>
              </ul>
              <Link to="/register">
                <Button className="w-full mt-6 bg-white text-blue-600 hover:bg-blue-50">Upgrade to Pro</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="container mx-auto px-6 py-8 border-t border-slate-700">
        <div className="flex justify-between items-center text-slate-400">
          <div className="flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            <span>QRTrack</span>
          </div>
          <p>Built for marketers, by marketers.</p>
        </div>
      </footer>
    </div>
  );
}

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.access_token);
        navigate('/dashboard');
      } else {
        const data = await res.json();
        setError(data.detail || 'Login failed');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-white">QRTrack</span>
          </Link>
          <CardTitle className="text-white">Welcome back</CardTitle>
          <CardDescription className="text-slate-400">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="text-center text-slate-400 mt-4">
            Don't have an account? <Link to="/register" className="text-blue-500 hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.access_token);
        navigate('/dashboard');
      } else {
        const data = await res.json();
        setError(data.detail || 'Registration failed');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-white">QRTrack</span>
          </Link>
          <CardTitle className="text-white">Create an account</CardTitle>
          <CardDescription className="text-slate-400">Start tracking your QR codes today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-slate-400 mt-4">
            Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2">
            <QrCode className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-white">QRTrack</span>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <Badge variant={user.subscription_status === 'pro' ? 'default' : 'secondary'}>
                {user.subscription_status === 'pro' ? 'Pro' : 'Free'}
              </Badge>
            )}
            <span className="text-slate-300">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-300">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}

function Dashboard() {
  const { token, user, refreshUser } = useAuth();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      refreshUser();
    }
  }, [searchParams]);

  useEffect(() => {
    fetchQRCodes();
  }, [token]);

  const fetchQRCodes = async () => {
    try {
      const res = await fetch(`${API_URL}/qr/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setQrCodes(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return;
    try {
      await fetch(`${API_URL}/qr/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchQRCodes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch(`${API_URL}/stripe/create-checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.checkout_url;
      } else {
        alert('Stripe not configured. Please set up Stripe API keys.');
      }
    } catch {
      alert('Error creating checkout session');
    }
  };

  const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scan_count, 0);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Manage your QR codes and track performance</p>
        </div>
        <div className="flex gap-4">
          {user?.subscription_status !== 'pro' && (
            <Button onClick={handleUpgrade} variant="outline" className="gap-2">
              <Zap className="h-4 w-4" /> Upgrade to Pro
            </Button>
          )}
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create QR Code
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Total QR Codes</CardDescription>
            <CardTitle className="text-3xl text-white">{qrCodes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Total Scans</CardDescription>
            <CardTitle className="text-3xl text-white">{totalScans}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Plan</CardDescription>
            <CardTitle className="text-3xl text-white capitalize">{user?.subscription_status || 'Free'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {showCreate && (
        <CreateQRModal onClose={() => setShowCreate(false)} onCreated={fetchQRCodes} />
      )}

      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : qrCodes.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-12 text-center">
            <QrCode className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No QR codes yet</h3>
            <p className="text-slate-400 mb-4">Create your first QR code to start tracking</p>
            <Button onClick={() => setShowCreate(true)}>Create QR Code</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qr) => (
            <QRCodeCard key={qr.id} qr={qr} onDelete={() => handleDelete(qr.id)} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function QRCodeCard({ qr, onDelete }: { qr: QRCode; onDelete: () => void }) {
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const res = await fetch(`${API_URL}/qr/${qr.id}/image`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const blob = await res.blob();
          setImageUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchImage();
  }, [qr.id, token]);

  const copyLink = () => {
    navigator.clipboard.writeText(`${API_URL}/r/${qr.short_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-white">{qr.name}</CardTitle>
            <CardDescription className="text-slate-400 truncate max-w-48">
              {qr.target_url}
            </CardDescription>
          </div>
          <Badge variant="secondary">{qr.scan_count} scans</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-4">
          {imageUrl ? (
            <img src={imageUrl} alt={qr.name} className="w-32 h-32 rounded" />
          ) : (
            <div className="w-32 h-32 bg-slate-700 rounded flex items-center justify-center">
              <QrCode className="h-12 w-12 text-slate-500" />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Link to={`/qr/${qr.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <a href={qr.target_url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-400">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateQRModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [color, setColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/qr/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, target_url: targetUrl, color, bg_color: bgColor }),
      });
      if (res.ok) {
        onCreated();
        onClose();
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to create QR code');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Create QR Code</CardTitle>
          <CardDescription className="text-slate-400">Enter the details for your new QR code</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My QR Code"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url" className="text-slate-300">Destination URL</Label>
              <Input
                id="url"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color" className="text-slate-300">QR Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-10 p-1 bg-slate-700 border-slate-600"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bgColor" className="text-slate-300">Background</Label>
                <div className="flex gap-2">
                  <Input
                    id="bgColor"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-10 p-1 bg-slate-700 border-slate-600"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function QRDetailPage() {
  const { token, user } = useAuth();
  const [qr, setQr] = useState<QRCode | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  const id = window.location.pathname.split('/').pop();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qrRes, analyticsRes] = await Promise.all([
          fetch(`${API_URL}/qr/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/qr/${id}/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (qrRes.ok) setQr(await qrRes.json());
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json());

        const imgRes = await fetch(`${API_URL}/qr/${id}/image`, { headers: { Authorization: `Bearer ${token}` } });
        if (imgRes.ok) {
          const blob = await imgRes.blob();
          setImageUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, token]);

  const downloadQR = () => {
    if (imageUrl) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `${qr?.name || 'qrcode'}.png`;
      a.click();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center text-slate-400 py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!qr) {
    return (
      <DashboardLayout>
        <div className="text-center text-slate-400 py-12">QR code not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4 text-slate-400">
        Back to Dashboard
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{qr.name}</CardTitle>
            <CardDescription className="text-slate-400 break-all">{qr.target_url}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {imageUrl ? (
              <img src={imageUrl} alt={qr.name} className="w-48 h-48 mx-auto rounded mb-4" />
            ) : (
              <div className="w-48 h-48 mx-auto bg-slate-700 rounded flex items-center justify-center mb-4">
                <QrCode className="h-16 w-16 text-slate-500" />
              </div>
            )}
            <Button onClick={downloadQR} className="w-full">Download QR Code</Button>
            <p className="text-slate-400 text-sm mt-4">
              Short URL: <code className="bg-slate-700 px-2 py-1 rounded">{API_URL}/r/{qr.short_code}</code>
            </p>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Total Scans</CardDescription>
                <CardTitle className="text-2xl text-white">{analytics?.total_scans || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Today</CardDescription>
                <CardTitle className="text-2xl text-white">{analytics?.scans_today || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">This Week</CardDescription>
                <CardTitle className="text-2xl text-white">{analytics?.scans_this_week || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">This Month</CardDescription>
                <CardTitle className="text-2xl text-white">{analytics?.scans_this_month || 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {user?.subscription_status === 'pro' && analytics?.scans_by_day && analytics.scans_by_day.length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Scans Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.scans_by_day}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {user?.subscription_status !== 'pro' && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="py-8 text-center">
                <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Upgrade for Full Analytics</h3>
                <p className="text-slate-400 mb-4">Get detailed charts, location data, and device breakdowns</p>
                <Button>Upgrade to Pro</Button>
              </CardContent>
            </Card>
          )}

          {user?.subscription_status === 'pro' && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Top Countries</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.top_countries && analytics.top_countries.length > 0 ? (
                    <ul className="space-y-2">
                      {analytics.top_countries.map((c, i) => (
                        <li key={i} className="flex justify-between text-slate-300">
                          <span>{c.country || 'Unknown'}</span>
                          <span className="text-slate-400">{c.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400">No location data yet</p>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Devices</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.top_devices && analytics.top_devices.length > 0 ? (
                    <ul className="space-y-2">
                      {analytics.top_devices.map((d, i) => (
                        <li key={i} className="flex justify-between text-slate-300">
                          <span className="capitalize">{d.device}</span>
                          <span className="text-slate-400">{d.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400">No device data yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function PricingPage() {
  const { token } = useAuth();

  const handleUpgrade = async () => {
    if (!token) {
      window.location.href = '/register';
      return;
    }
    try {
      const res = await fetch(`${API_URL}/stripe/create-checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.checkout_url;
      } else {
        alert('Stripe not configured. Please set up Stripe API keys.');
      }
    } catch {
      alert('Error creating checkout session');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <QrCode className="h-8 w-8 text-blue-500" />
          <span className="text-2xl font-bold text-white">QRTrack</span>
        </Link>
        <div className="flex gap-4">
          {token ? (
            <Link to="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-white">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="container mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-white text-center mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-slate-400 text-center mb-12">Choose the plan that works for you</p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Free</CardTitle>
              <div className="text-5xl font-bold text-white">$0<span className="text-lg font-normal text-slate-400">/month</span></div>
            </CardHeader>
            <CardContent className="text-slate-300">
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /> 5 QR codes</li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /> Basic scan count</li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /> Standard support</li>
              </ul>
              <Link to="/register">
                <Button className="w-full" variant="outline">Get Started Free</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-blue-600 border-blue-500 relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500">Most Popular</Badge>
            <CardHeader>
              <CardTitle className="text-white text-2xl">Pro</CardTitle>
              <div className="text-5xl font-bold text-white">$9.99<span className="text-lg font-normal text-blue-200">/month</span></div>
            </CardHeader>
            <CardContent className="text-blue-100">
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-white" /> Unlimited QR codes</li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-white" /> Full analytics</li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-white" /> Location tracking</li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-white" /> Device breakdown</li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-white" /> Custom colors</li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-white" /> Priority support</li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-white" /> API access</li>
              </ul>
              <Button className="w-full bg-white text-blue-600 hover:bg-blue-50" onClick={handleUpgrade}>
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/qr/:id" element={<ProtectedRoute><QRDetailPage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
