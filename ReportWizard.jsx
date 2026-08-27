import { db } from '@/api/base44Client';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/PageHeader';
import { capturePhoto, getCurrentLocation } from '@/lib/nativeCapture';
import { Camera, Image as ImageIcon, MapPin, Navigation, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const categories = ['Electronics', 'Bags', 'Documents', 'Jewelry', 'Keys', 'Pets', 'Clothing', 'Other'];

export default function ReportWizard() {
  const { type } = useParams();
  const lost = type === 'lost';
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    brand: '',
    color: '',
    distinguishing_marks: '',
    location_text: '',
    location_lat: null,
    location_lng: null,
    date: '',
    time: '',
    current_holder_location: '',
    files: [],
    previews: [],
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-fetch GPS when entering Step 4 if not already captured
  useEffect(() => {
    if (step === 4 && form.location_lat === null) {
      handleFetchGPS();
    }
  }, [step]);

  const handleFetchGPS = async () => {
    setGpsLoading(true);
    setGpsStatus('Fetching GPS coordinates...');
    try {
      const loc = await getCurrentLocation();
      if (loc.latitude !== null && loc.longitude !== null) {
        setForm((f) => ({
          ...f,
          location_lat: loc.latitude,
          location_lng: loc.longitude,
        }));
        setGpsStatus(`GPS captured: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
      } else {
        setGpsStatus(loc.error || 'GPS position unavailable');
      }
    } catch (err) {
      console.warn('GPS capture error:', err);
      setGpsStatus('GPS position unavailable');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleTakeNativePhoto = async (sourceType = 'camera') => {
    setError('');
    try {
      const res = await capturePhoto({ source: sourceType, quality: 90 });
      if (res.file) {
        const newFiles = [...form.files, res.file].slice(0, 4);
        const newPreviews = [...form.previews, res.dataUrl || URL.createObjectURL(res.file)].slice(0, 4);
        setForm((f) => ({ ...f, files: newFiles, previews: newPreviews }));
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err) {
      console.error('Camera capture error:', err);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []).slice(0, 4 - form.files.length);
    if (!selectedFiles.length) return;

    const newPreviews = selectedFiles.map((f) => URL.createObjectURL(f));
    setForm((f) => ({
      ...f,
      files: [...f.files, ...selectedFiles].slice(0, 4),
      previews: [...f.previews, ...newPreviews].slice(0, 4),
    }));
  };

  const handleRemovePhoto = (index) => {
    setForm((f) => ({
      ...f,
      files: f.files.filter((_, i) => i !== index),
      previews: f.previews.filter((_, i) => i !== index),
    }));
  };

  const handleAutoFillTestData = () => {
    setForm((f) => ({
      ...f,
      category: f.category || 'Electronics',
      title: 'Apple AirPods Pro (2nd Gen) in White Case',
      description: 'White MagSafe charging case with a small scratch near the hinge. Left earbud has a tiny blue silicone tip.',
      brand: 'Apple',
      color: 'White',
      distinguishing_marks: 'Blue silicone tip on left earbud; small scratch on back near hinge.',
      location_text: 'Central Campus Library, 2nd Floor Study Lounge',
      location_lat: f.location_lat !== null ? f.location_lat : 10.8231,
      location_lng: f.location_lng !== null ? f.location_lng : 78.6942,
      date: new Date().toISOString().split('T')[0],
      time: '14:30',
      current_holder_location: 'Campus Security Office, Counter 2',
    }));
    setError('');
  };

  const next = () => {
    setError('');
    if (step === 1 && !form.category) return setError('Choose a category to continue.');
    if (step === 2 && (!form.title || !form.description)) return setError('Add a title and description.');
    if (step === 4 && (!form.location_text || !form.date || (!lost && !form.current_holder_location))) return setError('Complete the required location and date details.');
    setStep((s) => Math.min(6, s + 1));
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const authUser = await db.auth.me().catch(() => null);
      const userId = authUser?.id || `user-guest-${Date.now()}`;
      let urls = [];
      for (const file of form.files.slice(0, 4)) {
        const { file_url } = await db.integrations.Core.UploadFile({ file }).catch(() => ({ file_url: '' }));
        if (file_url) urls.push(file_url);
      }

      const own = lost
        ? await db.entities.LostReports.filter({ reporter_id: userId, category: form.category }, '-created_date', 20).catch(() => [])
        : await db.entities.FoundReports.filter({ finder_id: userId, category: form.category }, '-created_date', 20).catch(() => []);

      const duplicate = (own || []).find((r) => Math.abs(new Date(r.lost_date || r.found_date) - new Date(form.date)) <= 172800000);

      const payload = {
        title: form.title,
        category: form.category,
        description: form.description,
        brand: form.brand,
        color: form.color,
        distinguishing_marks: form.distinguishing_marks,
        location_text: form.location_text,
        location_lat: form.location_lat !== null ? Number(form.location_lat) : null,
        location_lng: form.location_lng !== null ? Number(form.location_lng) : null,
        primary_image_url: urls[0] || '',
        status: 'active',
        is_duplicate_of: duplicate?.id || '',
        ...(lost
          ? { reporter_id: userId, lost_date: form.date, lost_time: form.time }
          : {
              finder_id: userId,
              found_date: form.date,
              found_time: form.time,
              current_holder_location: form.current_holder_location,
            }),
      };

      const report = lost
        ? await db.entities.LostReports.create(payload)
        : await db.entities.FoundReports.create(payload);

      if (urls.length && report?.id) {
        await db.entities.ItemImages.bulkCreate(
          urls.map((image_url, i) => ({
            report_id: report.id,
            report_type: type,
            image_url,
            uploaded_by: userId,
            is_primary: i === 0,
          }))
        ).catch(() => null);
      }

      if (report?.id) {
        await db.functions.invoke('runMatching', { reportId: report.id, reportType: type }).catch(() => null);
      }
      nav('/matches', { state: { submitted: true } });
    } catch (e) {
      setError(e.message || 'We could not submit your report. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-8">
      <div className="flex items-center justify-between gap-4 mb-2">
        <PageHeader
          eyebrow={`${lost ? 'Lost' : 'Found'} item report`}
          title={lost ? 'Help us identify your lost item' : 'Help reunite this item with its owner'}
          description="Your details are used to suggest potential matches. Ownership is always verified by a person."
        />
      </div>

      {/* Auto-Fill Test Data Banner */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
        <span>⚡ <strong>Testing Mode:</strong> Auto-fill sample item data to skip manual typing.</span>
        <Button
          type="button"
          size="sm"
          onClick={handleAutoFillTestData}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 h-auto font-medium shadow-sm"
        >
          ✨ Fill Sample Test Data
        </Button>
      </div>

      <div className="mb-8 flex gap-2" aria-label={`Step ${step} of 6`}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-8">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold">What kind of item?</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => set('category', c)}
                  className={`rounded-xl border p-4 text-sm font-semibold transition ${
                    form.category === c ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:border-slate-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Item details</h2>
            <Field label="Item title" value={form.title} onChange={(v) => set('title', v)} />
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-2 text-sm"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Describe the item without revealing private proof of ownership"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand (optional)" value={form.brand} onChange={(v) => set('brand', v)} />
              <Field label="Color (optional)" value={form.color} onChange={(v) => set('color', v)} />
            </div>
            <Field label="Distinguishing marks (optional)" value={form.distinguishing_marks} onChange={(v) => set('distinguishing_marks', v)} />
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold">Add photos</h2>
            <p className="mt-1 text-sm text-slate-500">
              Capture or upload up to four clear images. High-resolution photos increase AI matching accuracy.
            </p>

            {/* Native Mobile Camera & Gallery Capture Buttons */}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => handleTakeNativePhoto('camera')}
                disabled={form.files.length >= 4}
                className="bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2.5 flex items-center gap-2"
              >
                <Camera className="h-4 w-4" /> Take Photo (Camera)
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleTakeNativePhoto('photos')}
                disabled={form.files.length >= 4}
                className="text-xs px-4 py-2.5 flex items-center gap-2 border-slate-300"
              >
                <ImageIcon className="h-4 w-4 text-slate-600" /> Choose from Gallery
              </Button>
            </div>

            {/* Traditional File Input Fallback */}
            <div className="mt-4">
              <Label className="text-xs text-slate-500">Or choose files from your device:</Label>
              <Input
                className="mt-1.5 text-xs"
                type="file"
                accept="image/*"
                multiple
                disabled={form.files.length >= 4}
                onChange={handleFileInputChange}
              />
            </div>

            {/* Image Previews Grid */}
            {form.previews.length > 0 && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {form.previews.map((src, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-50">
                    <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(i)}
                      className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition"
                      title="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-3 text-xs text-slate-500 font-medium">
              {form.files.length}/4 photo(s) selected
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Where and when?</h2>

            <Field label={`${lost ? 'Lost' : 'Found'} location (Address / Landmark)`} value={form.location_text} onChange={(v) => set('location_text', v)} />

            {!lost && (
              <Field label="Current holder location" value={form.current_holder_location} onChange={(v) => set('current_holder_location', v)} />
            )}

            {/* Geolocation Auto-Detection Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-600" /> Device Geolocation Coordinates
                  </h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    GPS coordinates power spatial matching algorithms for precision distance scoring.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchGPS}
                  disabled={gpsLoading}
                  className="text-xs border-slate-300 bg-white"
                >
                  {gpsLoading ? (
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Navigation className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                  )}
                  {form.location_lat !== null ? 'Refresh GPS' : 'Capture GPS'}
                </Button>
              </div>

              {/* Status Badge */}
              <div className="mt-3 flex items-center gap-2 text-xs font-medium">
                {form.location_lat !== null ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-green-700 border border-green-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    Coordinates: {form.location_lat.toFixed(5)}, {form.location_lng.toFixed(5)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 border border-amber-200">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    {gpsStatus || 'No GPS coordinates captured'}
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" type="date" value={form.date} onChange={(v) => set('date', v)} />
              <Field label="Time (optional)" type="time" value={form.time} onChange={(v) => set('time', v)} />
            </div>
          </div>
        )}

        {step === 5 && <Review form={form} lost={lost} />}

        {step === 6 && (
          <div className="py-8 text-center">
            <Shield />
            <h2 className="mt-5 text-xl font-bold">Ready to submit</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              After submission, FindBack AI will compare candidate reports using text fingerprinting, spatial indexing, and visual scoring.
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 font-medium">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={() => (step === 1 ? nav(-1) : setStep((s) => s - 1))}>
            Back
          </Button>
          {step < 6 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={submit} disabled={busy}>
              {busy ? 'Submitting & matching…' : 'Submit report'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-2 text-sm" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Review({ form, lost }) {
  return (
    <div>
      <h2 className="text-xl font-bold">Review your report</h2>
      <dl className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-5 text-sm sm:grid-cols-2 border border-slate-100">
        {[
          ['Type', lost ? 'Lost' : 'Found'],
          ['Category', form.category],
          ['Item', form.title],
          ['Location', form.location_text],
          [
            'GPS Coordinates',
            form.location_lat !== null
              ? `${form.location_lat.toFixed(4)}, ${form.location_lng.toFixed(4)}`
              : 'Not captured',
          ],
          ['Date', form.date],
          ['Images', `${form.files.length} photo(s)`],
        ].map(([a, b]) => (
          <div key={a}>
            <dt className="text-slate-500 text-xs">{a}</dt>
            <dd className="mt-1 font-semibold text-slate-900">{b || 'Not provided'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Shield() {
  return (
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-100 font-bold text-violet-700 text-lg">
      AI
    </div>
  );
}