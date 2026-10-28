import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Multi-language fallback dictionary for instant offline / fallback operations
const OFFLINE_TRANSLATIONS: Record<string, Record<string, string>> = {
  'Namaste': {
    en: 'Hello / Greetings (Namaste)',
    hi: 'नमस्ते',
    or: 'ନମସ୍କାର',
    bn: 'নমস্কার',
    te: 'నమస్కారం',
    ta: 'வணக்கம்',
    ml: 'നമസ്കാരം',
    kn: 'ನಮಸ್ಕಾರ',
    mr: 'नमस्ते',
    gu: 'નમસ્તે',
    pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
    as: 'নমস্কাৰ',
    ur: 'سلام',
  },
  'Thank You': {
    en: 'Thank you very much',
    hi: 'धन्यवाद',
    or: 'ଧନ୍ୟବାଦ',
    bn: 'ধন্যবাদ',
    te: 'ధన్యవాదాలు',
    ta: 'நன்றி',
    ml: 'നന്ദി',
    kn: 'ಧನ್ಯವಾದಗಳು',
    mr: 'धन्यवाद',
    gu: 'આભાર',
    pa: 'ਧੰਨਵਾਦ',
    as: 'ধন্যবাদ',
    ur: 'شکریہ',
  },
  'Chai / Tea': {
    en: 'I would like a cup of Chai / Tea.',
    hi: 'मुझे एक कप चाय चाहिए।',
    or: 'ମୋତେ କପେ ଚାହା ଦରକାର।',
    bn: 'আমার এক কাপ চা দরকার।',
    te: 'నాకు ఒక కప్పు టీ కావాలి.',
    ta: 'எனக்கு ஒரு கப் தேநீர் வேண்டும்.',
    ml: 'എനിക്ക് ഒരു കപ്പ് ചായ വേണം.',
    kn: 'ನನಗೆ ಒಂದು ಕಪ್ ಚಹಾ ಬೇಕು.',
    mr: 'मला एक कप चहा हवा आहे.',
    gu: 'મને એક કપ ચા જોઈએ છે.',
    pa: 'ਮੈਨੂੰ ਇੱਕ ਕੱਪ ਚਾਹ ਚਾਹੀਦੀ ਹੈ।',
    as: 'মোক এভাগ চাহ লাগে।',
    ur: 'مجھے ایک کپ چائے چاہیے۔',
  },
  'How Are You?': {
    en: 'How are you doing?',
    hi: 'आप कैसे हैं?',
    or: 'ଆପଣ କେମିତି ଅଛନ୍ତି?',
    bn: 'আপনি কেমন আছেন?',
    te: 'మీరు ఎలా ఉన్నారు?',
    ta: 'நீங்கள் எப்படி இருக்கிறீர்கள்?',
    ml: 'സുഖമാണോ?',
    kn: 'ನೀವು ಹೇಗಿದ್ದೀರಿ?',
    mr: 'तुम्ही कसे आहात?',
    gu: 'તમે કેમ છો?',
    pa: 'ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?',
    as: 'আপুনি কেনে আছে?',
    ur: 'آپ کیسے ہیں؟',
  },
  'I Need Water': {
    en: 'I need water.',
    hi: 'मुझे पानी चाहिए।',
    or: 'ମୋତେ ପାଣି ଦରକାର।',
    bn: 'আমার জল দরকার।',
    te: 'నాకు నీరు కావాలి.',
    ta: 'எனக்கு தண்ணீர் வேண்டும்.',
    ml: 'എനിക്ക് വെള്ളം വേണം.',
    kn: 'ನನಗೆ ನೀರು ಬೇಕು.',
    mr: 'मला पाणी हवे आहे.',
    gu: 'મને પાણી જોઈએ છે.',
    pa: 'ਮੈਨੂੰ ਪਾਣੀ ਚਾਹੀਦਾ ਹੈ।',
    as: 'মোক পানী লাগে।',
    ur: 'مجھے پانی چاہیے۔',
  },
  'I Need Food / Hungry': {
    en: 'I am hungry, I need food.',
    hi: 'मुझे भूख लगी है, भोजन चाहिए।',
    or: 'ମୋତେ ଭୋକ ଲାଗିଛି, ଖାଦ୍ୟ ଦରକାର।',
    bn: 'আমার খিদে পেয়েছে, খাবার দরকার।',
    te: 'నాకు ఆకలిగా ఉంది, ఆహారం కావాలి.',
    ta: 'எனக்கு பசிக்கிறது, உணவு வேண்டும்.',
    ml: 'എനിക്ക് വിശക്കുന്നു, ഭക്ഷണം വേണം.',
    kn: 'ನನಗೆ ಹಸಿವಾಗಿದೆ, ಊಟ ಬೇಕು.',
    mr: 'मला भूक लागली आहे, जेवण हवे.',
    gu: 'મને ભૂખ લાગી છે, ખોરાક જોઈએ છે.',
    pa: 'ਮੈਨੂੰ ਭੁੱਖ ਲੱਗੀ ਹੈ, ਖਾਣਾ ਚਾਹੀਦਾ ਹੈ।',
    as: 'মোৰ ভোক লাগিছে, খাদ্য লাগে।',
    ur: 'مجھے بھوک لگی ہے، کھانا چاہیے۔',
  },
  'Emergency Help': {
    en: 'Emergency! Please help me immediately.',
    hi: 'आपातकाल! कृपया तुरंत मेरी सहायता करें।',
    or: 'ଜରୁରୀକାଳୀନ ପରିସ୍ଥିତି! ଦୟାକରି ତୁରନ୍ତ ମୋତେ ସାହାଯ୍ୟ କରନ୍ତୁ।',
    bn: 'জরুরি অবস্থা! দয়া করে আমাকে অবিলম্বে সাহায্য করুন।',
    te: 'అత్యవసరం! దయచేసి వెంటనే నాకు సహాయం చేయండి.',
    ta: 'அவசரம்! தயவுசெய்து உடனே எனக்கு உதவுங்கள்.',
    ml: 'അടിയന്തിരം! ദയവായി എന്നെ ഉടനടി സഹായിക്കൂ.',
    kn: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿ! ದಯವಿಟ್ಟು ತಕ್ಷಣ ನನಗೆ ಸಹಾಯ ಮಾಡಿ.',
    mr: 'तातडीची मदत! कृपया मला लगेच मदत करा.',
    gu: 'કટોકટી! કૃપા કરીને તરત જ મને મદદ કરો.',
    pa: 'ਐਮਰਜੈਂਸੀ! ਕਿਰਪਾ ਕਰਕੇ ਤੁਰੰਤ ਮੇਰੀ ਮਦਦ ਕਰੋ।',
    as: 'জৰুৰীকালীন! অনুগ্ৰহ কৰি মোক তৎক্ষণাৎ সহায় কৰক।',
    ur: 'ایمرجنسی! براہ کرم فوری میری مدد کریں۔',
  },
  'Call Doctor / Hospital': {
    en: 'Please call a doctor or ambulance.',
    hi: 'कृपया डॉक्टर या एम्बुलेंस को बुलाएं।',
    or: 'ଦୟାକରି ଡାକ୍ତର କିମ୍ବା ଆମ୍ବୁଲାନ୍ସ ଡାକନ୍ତୁ।',
    bn: 'দয়া করে একজন ডাক্তার বা অ্যাম্বুলেন্স ডাকুন।',
    te: 'దయచేసి వైద్యుడిని లేదా అంబులెన్స్‌ను పిలవండి.',
    ta: 'தயவுசெய்து ஒரு மருத்துவர் அல்லது ஆம்புலன்ஸை அழைக்கவும்.',
    ml: 'ദയവായി ഒരു ഡോക്ടറെയോ ആംബുലൻസിനെയോ വിളിക്കൂ.',
    kn: 'ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಅಥವಾ ಆಂಬ್ಯುಲೆನ್ಸ್ ಅನ್ನು ಕರೆಯಿರಿ.',
    mr: 'कृपया डॉक्टर किंवा रुग्णवाहिका बोलवा.',
    gu: 'કૃપા કરીને ડૉક્ટર અથવા એમ્બ્યુલન્સ બોલાવો.',
    pa: 'ਕਿਰਪਾ ਕਰਕੇ ਡਾਕਟਰ ਜਾਂ ਐਂਬੂਲੈਂਸ ਨੂੰ ਬੁਲਾਓ।',
    as: 'অনুগ্ৰহ কৰি ডাক্তৰ বা এম্বুলেন্স মাতক।',
    ur: 'براہ کرم ڈاکٹر یا ایمبولینس کو بلائیں۔',
  },
  'I am Deaf / Hearing Impaired': {
    en: 'I am Deaf. Please communicate via text or ISL.',
    hi: 'मैं बधिर हूँ। कृपया लिखकर या सांकेतिक भाषा में बात करें।',
    or: 'ମୁଁ ବଧିର। ଦୟାକରି ଲେଖି କିମ୍ବା ସାଙ୍କେତିକ ଭାଷା ମାଧ୍ୟମରେ ଯୋଗାଯୋଗ କରନ୍ତୁ।',
    bn: 'আমি বধির। দয়া করে লিখে অথবা সাংকেতিক ভাষায় কথা বলুন।',
    te: 'నేను బధిరుడిని. దయచేసి వచన సందేశం ద్వారా సంప్రదించండి.',
    ta: 'நான் செவித்திறன் குறைபாடுடையவன். தயவுசெய்து எழுதி காட்டுங்கள்.',
    ml: 'ഞാൻ ബധിരനാണ്. ദയവായി എഴുതി കാണിക്കൂ.',
    kn: 'ನಾನು ಕಿವುಡ. ದಯವಿಟ್ಟು ಬರೆದು ಅಥವಾ ಸನ್ನೆ ಭಾಷೆಯಲ್ಲಿ ಸಂವಹನ ನಡೆಸಿ.',
    mr: 'मी कर्णबधिर आहे. कृपया लिहून किंवा सांकेतिक भाषेत संवाद साधा.',
    gu: 'હું બહેરો છું. કૃપા કરીને લખીને વાતચીત કરો.',
    pa: 'ਮੈਂ ਸੁਣਨ ਵਿੱਚ ਅਸਮਰੱਥ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਲਿਖ ਕੇ ਗੱਲ ਕਰੋ।',
    as: 'মই কলা। অনুগ্ৰহ কৰি লিখি যোগাযোগ কৰক।',
    ur: 'میں بولنے اور سننے سے معذور ہوں۔ براہ کرم لکھ کر رابطہ کریں۔',
  },
  'Where is the Bathroom / Restroom?': {
    en: 'Where is the restroom / bathroom?',
    hi: 'शौचालय कहाँ है?',
    or: 'ଶୌଚାଳୟ କେଉଁଠାରେ ଅଛି?',
    bn: 'শৌচালয় কোথায়?',
    te: 'వాష్‌రూమ్ ఎక్కడ ఉంది?',
    ta: 'கழிப்பறை எங்கே உள்ளது?',
    ml: 'ടോയ്‌ലറ്റ് എവിടെയാണ്?',
    kn: 'ಶೌಚಾಲಯ ಎಲ್ಲಿದೆ?',
    mr: 'शौचालय कुठे आहे?',
    gu: 'શૌચાલય ક્યાં છે?',
    pa: 'ਵਾਸ਼ਰੂਮ ਕਿੱਥੇ ਹੈ?',
    as: 'শৌচাগাৰ ক’ত আছে?',
    ur: 'باتھ روم کہاں ہے؟',
  },
  'Yes': {
    en: 'Yes, correct.',
    hi: 'हाँ, सही है।',
    or: 'ହଁ, ଠିକ୍ ଅଛି।',
    bn: 'হ্যাঁ, ঠিক।',
    te: 'అవును, సరైనది.',
    ta: 'ஆம், சரி.',
    ml: 'അതെ, ശരിയാണ്.',
    kn: 'ಹೌದು, ಸರಿ.',
    mr: 'होय, बरोबर आहे.',
    gu: 'હા, સાચું.',
    pa: 'ਹਾਂ, ਸਹੀ ਹੈ।',
    as: 'হয়, ঠিক।',
    ur: 'ہاں، بالکل۔',
  },
  'No': {
    en: 'No, that is not correct.',
    hi: 'नहीं, यह सही नहीं है।',
    or: 'ନା, ଏହା ଠିକ୍ ନୁହେଁ।',
    bn: 'না, এটা ঠিক নয়।',
    te: 'కాదు, అది తప్పు.',
    ta: 'இல்லை, அது சரியல்ல.',
    ml: 'അല്ല, അത് ശരിയല്ല.',
    kn: 'ಇಲ್ಲ, ಅದು ಸರಿಯಲ್ಲ.',
    mr: 'नाही, ते चूक आहे.',
    gu: 'ના, તે સાચું નથી.',
    pa: 'ਨਹੀਂ, ਇਹ ਸਹੀ ਨਹੀਂ ਹੈ।',
    as: 'নহয়, সেয়া ঠিক নহয়।',
    ur: 'نہیں، یہ ٹھیک نہیں۔',
  },
  'Stop': {
    en: 'Stop please.',
    hi: 'कृपया रुकिए।',
    or: 'ଦୟାକରି ଅଟକନ୍ତୁ।',
    bn: 'দয়া করে থামুন।',
    te: 'దయచేసి ఆగండి.',
    ta: 'தயவுசெய்து நிறுத்துங்கள்.',
    ml: 'ദയവായി നിൽക്കൂ.',
    kn: 'ದಯವಿಟ್ಟು ನಿಲ್ಲಿಸಿ.',
    mr: 'कृपया थांबा.',
    gu: 'કૃપા કરીને થોભો.',
    pa: 'ਕਿਰਪਾ ਕਰਕੇ ਰੁਕੋ।',
    as: 'অনুগ্ৰহ কৰি ৰওক।',
    ur: 'براہ کرم رکیں۔',
  },
  'Good Morning': {
    en: 'Good morning!',
    hi: 'सुप्रभात!',
    or: 'ଶୁଭ ସକାଳ!',
    bn: 'সুপ্রভাত!',
    te: 'శుభోదయం!',
    ta: 'காலை வணக்கம்!',
    ml: 'സുപ്രഭാതം!',
    kn: 'ಶುಭೋದಯ!',
    mr: 'शुभ प्रभात!',
    gu: 'સુપ્રભાત!',
    pa: 'ਸ਼ੁਭ ਸਵੇਰ!',
    as: 'শুভ প্ৰভাত!',
    ur: 'صبح بخیر!',
  },
};

// API: Translation Endpoint
app.post('/api/translate', async (req, res) => {
  const { text, targetLang = 'hi', sourceLang = 'en', islGloss = false } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text string is required' });
  }

  // Check offline dictionary first
  const trimmed = text.trim();
  const directMatch = OFFLINE_TRANSLATIONS[trimmed];
  if (directMatch && directMatch[targetLang]) {
    return res.json({
      translatedText: directMatch[targetLang],
      originalText: text,
      targetLang,
      source: 'offline-lexicon',
    });
  }

  // If Gemini API is available, perform contextual Indian regional translation
  if (ai) {
    try {
      const languageNames: Record<string, string> = {
        en: 'English',
        hi: 'Hindi',
        or: 'Odia',
        bn: 'Bengali',
        te: 'Telugu',
        ta: 'Tamil',
        ml: 'Malayalam',
        kn: 'Kannada',
        mr: 'Marathi',
        gu: 'Gujarati',
        pa: 'Punjabi',
        as: 'Assamese',
        ur: 'Urdu',
      };

      const targetLangName = languageNames[targetLang] || targetLang;

      const prompt = islGloss
        ? `You are an expert Indian Sign Language (ISL) linguist and interpreter. Convert the following sequence of ISL sign glosses into a grammatically natural, respectful sentence in ${targetLangName}. Output only the translated sentence without notes, markdown quotes, or preamble.\nISL Glosses: "${trimmed}"`
        : `Translate the following text accurately and respectfully into ${targetLangName} script. Output ONLY the translated text without extra explanation:\n"${trimmed}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const translated = response.text?.trim() || trimmed;

      return res.json({
        translatedText: translated,
        originalText: text,
        targetLang,
        source: 'gemini-3.8-flash',
      });
    } catch (err: unknown) {
      console.error('Translation error with Gemini, falling back to local fallback:', err);
    }
  }

  // Graceful rule-based fallback
  const fallback = OFFLINE_TRANSLATIONS[trimmed]?.[targetLang] || text;
  return res.json({
    translatedText: fallback,
    originalText: text,
    targetLang,
    source: 'local-fallback',
  });
});

// API: Continuous ISL Sequence Interpretation
app.post('/api/isl-interpret', async (req, res) => {
  const { signs, targetLang = 'en' } = req.body;

  if (!signs || !Array.isArray(signs) || signs.length === 0) {
    return res.status(400).json({ error: 'Array of signs is required' });
  }

  const signList = signs.join(' ');

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Translate this sequence of Indian Sign Language (ISL) recognized signs into a natural, grammatically coherent English sentence and also in Hindi:\nSigns: [${signList}]. Return in JSON format: {"english": "...", "hindi": "...", "confidence": 0.95}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        english: parsed.english || signList,
        hindi: parsed.hindi || '',
        confidence: parsed.confidence || 0.9,
        source: 'gemini-3.8-flash',
      });
    } catch (err) {
      console.error('Error interpreting ISL sequence:', err);
    }
  }

  return res.json({
    english: signList,
    hindi: '',
    confidence: 0.85,
    source: 'local-heuristic',
  });
});

// API: Speech Generation via Gemini 3.8 Flash Lite TTS
app.post('/api/tts', async (req, res) => {
  const { text, voice = 'Kore' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required for TTS' });
  }

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text: text.slice(0, 300) }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice as 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({
          audioBase64: base64Audio,
          mimeType: 'audio/wav',
        });
      }
    } catch (err) {
      console.warn('Gemini TTS unavailable, client will use browser SpeechSynthesis:', err);
    }
  }

  return res.json({
    audioBase64: null,
    fallbackToBrowserTTS: true,
  });
});

// API: Emergency Assistance Formatter
app.post('/api/emergency/format-sos', (req, res) => {
  const {
    emergencyType = 'Medical Assistance',
    latitude,
    longitude,
    address,
    userNotes,
    contactName,
  } = req.body;

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const coordsStr = hasCoords ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : 'Coordinates Unavailable (GPS Pending)';
  const mapLink = hasCoords ? `https://maps.google.com/?q=${latitude},${longitude}` : 'Location link pending';

  const message = `[ISHARA AI ACCESSIBILITY EMERGENCY SOS ALERT]
EMERGENCY TYPE: ${emergencyType.toUpperCase()}
CALLER STATUS: Deaf / Speech Impaired User
LOCATION: ${coordsStr}
ADDRESS: ${address || 'Local Address pending GPS lock'}
MAP LINK: ${mapLink}
${userNotes ? `PATIENT NOTE: ${userNotes}` : ''}
DISPATCH NOTE: User cannot hear spoken replies. Please dispatch emergency responder and communicate via SMS/Text where possible. Dial 112 directly.`;

  return res.json({
    message,
    smsUri: `sms:112?body=${encodeURIComponent(message)}`,
    whatsappUri: `https://wa.me/?text=${encodeURIComponent(message)}`,
    emergencyType,
    mapLink,
    coords: hasCoords ? { latitude, longitude } : null,
  });
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`ISHARA AI server running on port ${PORT}`);
  });
}

startServer();
