import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Container, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Popover,
  Alert,
  Slider
} from '@mui/material';
import { 
  ArrowBack, 
  ArrowForward, 
  Search as SearchIcon, 
  Autorenew as AutorenewIcon,
  FilterList as FilterListIcon,
  FilterListOff as FilterListOffIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';
import { Analytics } from "@vercel/analytics/react";
import { csvData } from './coursesData.js';
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9); // 9:00 - 21:00

// Renk paleti tanımlamaları
const COURSE_COLORS = [
  '#D42E12', // TED Kırmızı
  '#002379', // TED Lacivert
  '#F7D417', // TED Sarı
  '#2E7D32', // Koyu Yeşil
  '#7B1FA2', // Mor
  '#0288D1', // Mavi
  '#FF5722', // Turuncu
  '#C2185B', // Pembe
  '#00BFA5', // Turkuaz
  '#FFA000', // Amber
  '#9C27B0', // Mor
  '#3F51B5', // İndigo
  '#E91E63', // Pembe
  '#009688', // Yeşil
  '#FF3D00', // Turuncu
  '#673AB7', // Mor
  '#4CAF50', // Yeşil
  '#2196F3', // Mavi
  '#FF9800', // Turuncu
  '#8BC34A', // Açık Yeşil
  '#1976D2', // Mavi
  '#F44336', // Kırmızı
  '#03A9F4', // Açık Mavi
  '#FF4081', // Pembe
  '#00BCD4'  // Camgöbeği
];

// Tema renkleri
const theme = {
  colors: {
    primary: '#002379', // TED Lacivert
    secondary: '#D42E12', // TED Kırmızı
    accent: '#F7D417', // TED Sarı
    background: '#f8fafc',
    surface: '#ffffff',
    text: {
      primary: '#1a1a1a',
      secondary: '#4a5568',
      light: '#ffffff'
    }
  },
  gradients: {
    primary: 'linear-gradient(135deg, #002379 0%, #001445 100%)',
    secondary: 'linear-gradient(135deg, #D42E12 0%, #B01D05 100%)',
    accent: 'linear-gradient(135deg, #F7D417 0%, #E5C415 100%)',
    mixed: 'linear-gradient(135deg, #002379 0%, #D42E12 100%)'
  },
  shadows: {
    small: '0 2px 4px rgba(0,0,0,0.1)',
    medium: '0 4px 6px rgba(0,0,0,0.1)',
    large: '0 10px 15px rgba(0,0,0,0.1)',
    hover: '0 15px 30px rgba(0,0,0,0.15)'
  },
  transitions: {
    default: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    xl: '24px'
  }
};

function parseSchedule(schedule) {
  if (!schedule) return [];
  
  const days = {
    'Mo': 'Pazartesi',
    'Tu': 'Salı',
    'We': 'Çarşamba',
    'Th': 'Perşembe',
    'Fr': 'Cuma',
    'Sa': 'Cumartesi'
  };
  
  const slots = [];
  // Önce gün gruplarına ayır (örn: "Mo 13 - 16" veya "Tu/Fr 09 - 12")
  const dayGroups = schedule.split(/(?=[A-Z][a-z])/);
  
  dayGroups.forEach(group => {
    if (!group.trim()) return;
    
    // Gün ve saat bilgilerini ayır
    const parts = group.trim().split(' ');
    
    // Günleri işle (Tu/Fr gibi birden fazla gün olabilir)
    const dayPart = parts[0];
    const dayList = dayPart.split('/');
    
    // Saat bilgisini işle
    const timeStart = parseInt(parts[1]);
    const timeEnd = parseInt(parts[3]);
    
    if (timeStart && timeEnd) {
      // Her gün için slot oluştur
      dayList.forEach(dayCode => {
        const day = days[dayCode];
        if (day) {
          slots.push({
            day,
            start: timeStart,
            end: timeEnd
          });
        }
      });
    }
  });
  
  console.log('Schedule:', schedule, 'Parsed:', slots); // Debug için
  return slots;
}

function checkTimeConflict(schedule1, schedule2) {
  for (const slot1 of schedule1) {
    for (const slot2 of schedule2) {
      if (slot1.day === slot2.day) {
        if (
          (slot1.start >= slot2.start && slot1.start < slot2.end) ||
          (slot2.start >= slot1.start && slot2.start < slot1.end)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function App() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [lecturers, setLecturers] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedCourseCodes, setSelectedCourseCodes] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [showCombinations, setShowCombinations] = useState(false);
  const [combinations, setCombinations] = useState([]);
  const [selectedCombination, setSelectedCombination] = useState(null);
  const [courseColors, setCourseColors] = useState({});
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [currentCourseCode, setCurrentCourseCode] = useState(null);
  const [currentCombinationIndex, setCurrentCombinationIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [courseFilters, setCourseFilters] = useState({});
  const [selectedCourseInfo, setSelectedCourseInfo] = useState(null);
  const [courseInfoAnchorEl, setCourseInfoAnchorEl] = useState(null);
  const [blockedTimeSlots, setBlockedTimeSlots] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('warning');
  const [allowConflicts, setAllowConflicts] = useState(false); // Çakışmalara izin verme durumu
  const [desiredEmptyDays, setDesiredEmptyDays] = useState(0);
  const scheduleRef = useRef(null);
  const lastUpdated = useMemo(() => new Date().toLocaleDateString('tr-TR'), []);

  useEffect(() => {
    // CSV dosyasını oku
    try {
      const results = Papa.parse(csvData, { header: true });
      const courseData = results.data.filter(course => course.Code && course.Name); // Boş satırları filtrele
      setCourses(courseData);
      setFilteredCourses(courseData);

      // Benzersiz hocaları ve sectionları çıkar
      const uniqueLecturers = [...new Set(courseData.map(course => course.Lecturer))].filter(Boolean);
      const uniqueSections = [...new Set(courseData.map(course => course.Section))].filter(Boolean);
      setLecturers(uniqueLecturers);
      setSections(uniqueSections);
    } catch (error) {
      console.error('CSV okuma hatası:', error);
    }
  }, []);

  useEffect(() => {
    // Arama işlemi
    const searchTermLower = searchTerm.toLowerCase().trim();
    const filtered = courses.filter(course => {
      const codeMatch = course.Code?.toLowerCase().includes(searchTermLower);
      const nameMatch = course.Name?.toLowerCase().includes(searchTermLower);
      return codeMatch || nameMatch;
    });
    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  const generateAllPossibleCombinations = () => {
    const courseSectionsMap = {};
    selectedCourseCodes.forEach(code => {
      let courseSections = courses.filter(c => c.Code === code);
      
      if (courseFilters[code]) {
        const { sections } = courseFilters[code];
        if (sections && sections.length > 0) {
          courseSections = courseSections.filter(c => sections.includes(c.Section));
        }
      }
      
      courseSectionsMap[code] = courseSections;
    });

    let allCombinations = [[]];
    let hasConflict = false;
    let hasBlockedTimeConflict = false;

    Object.entries(courseSectionsMap).forEach(([code, sections]) => {
      if (sections.length === 0) {
        allCombinations = [];
        return;
      }

      const newCombinations = [];
      allCombinations.forEach(combo => {
        sections.forEach(section => {
          const newCombo = [...combo, section];
          
          // Çakışma kontrolü
          let hasTimeConflict = false;
          if (!allowConflicts) { // Sadece çakışmalara izin verilmiyorsa kontrol et
            for (let i = 0; i < newCombo.length; i++) {
              for (let j = i + 1; j < newCombo.length; j++) {
                if (checkTimeConflict(
                  parseSchedule(newCombo[i].Schedule),
                  parseSchedule(newCombo[j].Schedule)
                )) {
                  hasTimeConflict = true;
                  hasConflict = true;
                  break;
                }
              }
              if (hasTimeConflict) break;
            }
          }

          // Boş zaman çakışması kontrolü
          let timeSlotConflict = false;
          if (!hasTimeConflict || allowConflicts) {
            const schedules = parseSchedule(section.Schedule);
            for (const schedule of schedules) {
              for (let hour = schedule.start; hour < schedule.end; hour++) {
                const timeSlot = `${schedule.day}-${hour}`;
                if (blockedTimeSlots.includes(timeSlot)) {
                  timeSlotConflict = true;
                  hasBlockedTimeConflict = true;
                  break;
                }
              }
              if (timeSlotConflict) break;
            }
          }

          if ((!hasTimeConflict || allowConflicts) && !timeSlotConflict) {
            newCombinations.push(newCombo);
          }
        });
      });
      allCombinations = newCombinations;
    });

    // Uyarı mesajlarını ayarla
    if (allCombinations.length === 0) {
      setAlertSeverity('error');
      if (Object.values(courseSectionsMap).some(sections => sections.length === 0)) {
        setAlertMessage('Seçilen filtrelerle uygun section bulunamadı!');
      } else {
        setAlertMessage('Seçilen dersler için uygun kombinasyon bulunamadı!');
      }
      setShowAlert(true);
    } else {
      if (hasConflict && !allowConflicts) {
        setAlertSeverity('warning');
        setAlertMessage('Bazı ders çakışmaları nedeniyle bazı kombinasyonlar gösterilemiyor. Çakışmalara izin vermek için "Çakışmalara İzin Ver" seçeneğini aktifleştirebilirsiniz.');
        setShowAlert(true);
      } else if (hasBlockedTimeConflict) {
        setAlertSeverity('warning');
        setAlertMessage('Boş zaman çakışmaları nedeniyle bazı kombinasyonlar gösterilemiyor.');
        setShowAlert(true);
      }
    }

    setTimeout(() => setShowAlert(false), 5000);
    setCombinations(allCombinations);
    setCurrentCombinationIndex(0);
  };

  const handleCourseSelect = (course) => {
    if (selectedCourseCodes.includes(course.Code)) {
      // Eğer ders zaten seçiliyse, seçimi kaldır
      handleCourseRemove(course.Code);
    } else {
      // Ders seçili değilse, seç
      assignCourseColor(course.Code);
      setSelectedCourseCodes(prev => [...prev, course.Code]);
    }
  };

  const handleCourseRemove = (courseCode) => {
    setSelectedCourseCodes(prev => prev.filter(code => code !== courseCode));
    setSelectedCourses(prev => prev.filter(course => course.Code !== courseCode));
    setCourseColors(prev => {
      const newColors = { ...prev };
      delete newColors[courseCode];
      return newColors;
    });
    setCourseFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[courseCode];
      return newFilters;
    });
    setSelectedCombination(null);
    setCombinations([]);
    setCurrentCombinationIndex(0);

    // Eğer kalan dersler varsa, kombinasyonları yeniden oluştur
    const remainingCourses = selectedCourseCodes.filter(code => code !== courseCode);
    if (remainingCourses.length > 0) {
      setTimeout(() => {
        generateAllPossibleCombinations();
      }, 0);
    }
  };

  // Ders seçildiğinde renk atama
  const assignCourseColor = (courseCode) => {
    if (!courseColors[courseCode]) {
      const usedColors = Object.values(courseColors);
      let availableColors = COURSE_COLORS.filter(color => !usedColors.includes(color));
      
      // Eğer tüm renkler kullanılmışsa, renkleri karıştırıp yeniden kullan
      if (availableColors.length === 0) {
        availableColors = [...COURSE_COLORS];
        // Renkleri karıştır
        for (let i = availableColors.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [availableColors[i], availableColors[j]] = [availableColors[j], availableColors[i]];
        }
      }
      
      // Rastgele bir renk seç
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      const selectedColor = availableColors[randomIndex];
      
      setCourseColors(prev => ({ ...prev, [courseCode]: selectedColor }));
    }
  };

  const renderTimeSlot = (day, hour, courses) => {
    if (!courses || courses.length === 0 || selectedCourseCodes.length === 0) {
      return null;
    }

    const coursesInSlot = courses.filter(course => {
      const schedules = parseSchedule(course.Schedule);
      return schedules.some(slot => slot.day === day && hour >= slot.start && hour < slot.end);
    });

    if (coursesInSlot.length > 0) {
      return (
        <Box sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          gap: '2px',
          padding: '1px'
        }}>
          {coursesInSlot.map((course, index) => (
            <Box 
              key={`${course.Code}-${course.Section}`}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedCourseInfo(course);
                setCourseInfoAnchorEl(event.currentTarget);
              }}
              sx={{
                flex: 1,
                background: `linear-gradient(180deg, ${courseColors[course.Code]}33, ${courseColors[course.Code]}22)`,
                border: `1px solid rgba(0,0,0,0.06)`,
                padding: '2px 4px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontFamily: '"Inter", sans-serif',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'saturate(140%) blur(2px)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 10px 18px rgba(0,0,0,0.10)',
                  background: `linear-gradient(180deg, ${courseColors[course.Code]}44, ${courseColors[course.Code]}22)`,
                  zIndex: 1
                }
              }}>
              <Typography 
                variant="caption"
                sx={{
                  color: theme.colors.text.primary,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {course.Section}
                <br />
                <span style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 600,
                  color: theme.colors.text.secondary
                }}>
                  {course.Room}
                </span>
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }

    return null;
  };

  const handleTimeSlotClick = (day, hour) => {
    const timeSlot = `${day}-${hour}`;
    setBlockedTimeSlots(prev => {
      const isBlocked = prev.includes(timeSlot);
      if (isBlocked) {
        return prev.filter(slot => slot !== timeSlot);
      } else {
        return [...prev, timeSlot];
      }
    });
    setCurrentCombinationIndex(0);
  };

  // Bir günün tamamen boş olup olmadığını kontrol eden fonksiyon
  const isDayEmpty = (day, combination) => {
    if (!combination || combination.length === 0) return true;
    return !combination.some(course => {
      const schedule = parseSchedule(course.Schedule);
      return schedule.some(slot => slot.day === day);
    });
  };

  // Bir kombinasyondaki boş gün sayısını hesaplayan fonksiyon
  const countEmptyDays = (combination) => {
    if (!combination || combination.length === 0) return DAYS.length;
    return DAYS.filter(day => isDayEmpty(day, combination)).length;
  };

  // Tüm filtreleme mantığını tek bir fonksiyonda toplama
  const applyAllFilters = (combinations) => {
    if (!combinations || combinations.length === 0) return [];

    // 1. Çakışma kontrolü
    let filtered = allowConflicts ? combinations : combinations.filter(combo => {
      for (let i = 0; i < combo.length; i++) {
        for (let j = i + 1; j < combo.length; j++) {
          if (checkTimeConflict(
            parseSchedule(combo[i].Schedule),
            parseSchedule(combo[j].Schedule)
          )) {
            return false;
          }
        }
      }
      return true;
    });

    // 2. Bloklanmış zaman dilimleri kontrolü
    if (blockedTimeSlots.length > 0) {
      filtered = filtered.filter(combo => {
        for (const course of combo) {
          const schedule = parseSchedule(course.Schedule);
          for (const slot of schedule) {
            for (const blockedSlot of blockedTimeSlots) {
              const [blockedDay, blockedHourStr] = blockedSlot.split('-');
              const blockedHour = parseInt(blockedHourStr);
              if (
                slot.day === blockedDay &&
                slot.start <= blockedHour &&
                slot.end > blockedHour
              ) {
                return false;
              }
            }
          }
        }
        return true;
      });
    }

    // 3. Kurs filtreleri kontrolü
    if (Object.keys(courseFilters).length > 0) {
      filtered = filtered.filter(combo => {
        for (const courseCode in courseFilters) {
          const filter = courseFilters[courseCode];
          const course = combo.find(c => c.Code === courseCode);
          
          if (!course) continue;

          if (filter.sections && filter.sections.length > 0 && !filter.sections.includes(course.Section)) {
            return false;
          }
        }
        return true;
      });
    }

    // 4. Boş gün kontrolü
    if (desiredEmptyDays > 0) {
      filtered = filtered.filter(combo => {
        const emptyDays = countEmptyDays(combo);
        return emptyDays >= desiredEmptyDays;
      });
    }

    return filtered;
  };

  // Kombinasyonları filtrele ve state'i güncelle
  const updateFilteredCombinations = () => {
    const filtered = applyAllFilters(combinations);
    
    if (filtered.length === 0 && combinations.length > 0) {
      if (desiredEmptyDays > 0) {
        setAlertMessage(`${desiredEmptyDays} boş gün içeren program kombinasyonu bulunamadı.`);
        setAlertSeverity('warning');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      } else {
        setAlertMessage('Seçilen filtrelerle uygun kombinasyon bulunamadı.');
        setAlertSeverity('warning');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    }

    // Geçerli kombinasyon indeksini güncelle
    if (currentCombinationIndex >= filtered.length) {
      setCurrentCombinationIndex(Math.max(0, filtered.length - 1));
    }

    return filtered;
  };

  // Boş gün seçici bileşeni
  const EmptyDaySelector = () => {
    const handleSliderChange = (_, newValue) => {
      if (newValue === desiredEmptyDays) return;
      
      setDesiredEmptyDays(newValue);
      setShowAlert(false);
      
      // Yeni değerle filtrelemeyi dene
      const filtered = applyAllFilters(combinations);
      if (filtered.length === 0 && newValue > 0) {
        // Eğer uygun kombinasyon bulunamazsa eski değere geri dön
        setDesiredEmptyDays(prevValue => {
          setAlertMessage(`${newValue} boş gün içeren program kombinasyonu bulunamadı.`);
          setAlertSeverity('warning');
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 3000);
          return prevValue;
        });
      }
    };

    return (
      <Box sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: theme.borderRadius.medium,
        padding: '8px 16px'
      }}>
        <Typography sx={{
          color: theme.colors.text.light,
          fontSize: '0.9rem',
          minWidth: '120px'
        }}>
          Boş Gün: {desiredEmptyDays}
        </Typography>
        <Slider
          value={desiredEmptyDays}
          onChange={handleSliderChange}
          step={1}
          marks
          min={0}
          max={6}
          valueLabelDisplay="auto"
          disabled={combinations.length === 0}
          sx={{
            color: 'white',
            '& .MuiSlider-thumb': {
              backgroundColor: 'white',
            },
            '& .MuiSlider-track': {
              backgroundColor: 'white',
            },
            '& .MuiSlider-rail': {
              backgroundColor: 'rgba(255,255,255,0.3)',
            },
            '& .MuiSlider-mark': {
              backgroundColor: 'white',
            },
            '& .MuiSlider-markLabel': {
              color: 'white',
            }
          }}
        />
      </Box>
    );
  };

  // Filtreleme değişikliklerini izle
  useEffect(() => {
    if (combinations.length > 0) {
      const filtered = updateFilteredCombinations();
      if (currentCombinationIndex >= filtered.length) {
        setCurrentCombinationIndex(Math.max(0, filtered.length - 1));
      }
    }
  }, [desiredEmptyDays, allowConflicts, blockedTimeSlots.length, courseFilters]);

  const filteredCombinations = useMemo(() => {
    return updateFilteredCombinations();
  }, [combinations, desiredEmptyDays, allowConflicts, blockedTimeSlots, courseFilters]);

  // Filtreleme bileşenleri için gerekli fonksiyonlar
  const getUniqueSections = (courseCode, selectedLecturer = '') => {
    return [...new Set(courses
      .filter(c => c.Code === courseCode && (!selectedLecturer || c.Lecturer === selectedLecturer))
      .map(c => c.Section))]
      .filter(Boolean)
      .sort();
  };

  const handleCourseFilter = (courseCode, type, value) => {
    setCourseFilters(prev => {
      const newFilters = { ...prev };
      
      if (!newFilters[courseCode]) {
        newFilters[courseCode] = { sections: [] };
      }

      const selectedSection = value;
      const currentSections = newFilters[courseCode].sections || [];
      
      if (selectedSection === '') {
        // "Tümü" seçildiyse tüm seçimleri temizle
        newFilters[courseCode].sections = [];
      } else if (currentSections.includes(selectedSection)) {
        // Eğer section zaten seçiliyse, listeden çıkar
        newFilters[courseCode].sections = currentSections.filter(s => s !== selectedSection);
      } else {
        // Değilse listeye ekle
        newFilters[courseCode].sections = [...currentSections, selectedSection];
      }
      
      return newFilters;
    });

    // Filtreleri uyguladıktan sonra kombinasyonları yeniden oluştur
    setTimeout(() => {
      if (selectedCourseCodes.length > 0) {
        generateAllPossibleCombinations();
      }
    }, 0);
  };

  // Filtre bileşenlerinin render edilmesi
  const renderFilters = (code) => {
    const course = courses.find(c => c.Code === code);
    const filters = courseFilters[code] || { sections: [] };
    const sections = getUniqueSections(code);

    return (
      <Paper key={code} elevation={0} sx={{
        p: 2,
        borderRadius: theme.borderRadius.medium,
        border: '1px solid rgba(0,0,0,0.1)',
        backgroundColor: `${courseColors[code]}11`
      }}>
        {/* Ders Başlığı */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Typography sx={{
            fontWeight: 600,
            color: theme.colors.text.primary,
            fontSize: '1rem'
          }}>
            {code}
          </Typography>
          <Typography sx={{
            color: theme.colors.text.secondary,
            fontSize: '0.9rem',
            maxWidth: '70%',
            textAlign: 'right'
          }}>
            {course?.Name}
          </Typography>
        </Box>

        {/* Section Seçimi */}
        <Box sx={{
          backgroundColor: 'rgba(0,0,0,0.02)',
          borderRadius: theme.borderRadius.medium,
          p: 2
        }}>
          <Typography variant="subtitle2" sx={{ 
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: theme.colors.text.primary,
            fontWeight: 600
          }}>
            Section ve Öğretim Üyesi
            <Typography variant="caption" sx={{ 
              color: theme.colors.text.secondary,
              fontWeight: 400
            }}>
              (Birden fazla seçilebilir)
            </Typography>
          </Typography>
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1
          }}>
            <Chip
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Tümü
                  {filters.sections.length === 0 && (
                    <CheckCircleIcon sx={{ 
                      fontSize: '0.9rem',
                      color: theme.colors.primary,
                      ml: 0.5
                    }} />
                  )}
                </Box>
              }
              onClick={() => handleCourseFilter(code, 'section', '')}
              variant={filters.sections.length === 0 ? "filled" : "outlined"}
              size="small"
              sx={{
                backgroundColor: filters.sections.length === 0
                  ? `${courseColors[code]}33`
                  : 'transparent',
                borderColor: filters.sections.length === 0
                  ? 'transparent'
                  : 'rgba(0,0,0,0.1)',
                color: filters.sections.length === 0
                  ? theme.colors.text.primary
                  : theme.colors.text.secondary,
                fontWeight: filters.sections.length === 0 ? 500 : 400,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: filters.sections.length === 0
                    ? `${courseColors[code]}44`
                    : 'rgba(0,0,0,0.05)',
                  transform: 'translateY(-1px)'
                }
              }}
            />
            {sections.map(section => {
              const sectionInfo = courses.find(c => c.Code === code && c.Section === section);
              const isSelected = filters.sections.includes(section);

              return (
                <Chip
                  key={section}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {`${section} - ${sectionInfo?.Lecturer}`}
                      {isSelected && (
                        <CheckCircleIcon sx={{ 
                          fontSize: '0.9rem',
                          color: theme.colors.primary,
                          ml: 0.5
                        }} />
                      )}
                    </Box>
                  }
                  onClick={() => handleCourseFilter(code, 'section', section)}
                  variant={isSelected ? "filled" : "outlined"}
                  size="small"
                  sx={{
                    backgroundColor: isSelected
                      ? `${courseColors[code]}33`
                      : 'transparent',
                    borderColor: isSelected
                      ? 'transparent'
                      : 'rgba(0,0,0,0.1)',
                    color: isSelected
                      ? theme.colors.text.primary
                      : theme.colors.text.secondary,
                    fontWeight: isSelected ? 500 : 400,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isSelected
                        ? `${courseColors[code]}44`
                        : 'rgba(0,0,0,0.05)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                />
              );
            })}
          </Box>
        </Box>
      </Paper>
    );
  };

  // Klavye olaylarını dinle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevCombination();
      } else if (e.key === 'ArrowRight') {
        handleNextCombination();
      } else if (e.altKey && e.key.toLowerCase() === 'r') {
        handleRemoveAllCourses();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCombinations.length]);

  const handleRemoveAllCourses = () => {
    setSelectedCourseCodes([]);
    setSelectedCourses([]);
    setCourseColors({});
    setCourseFilters({});
    setSelectedCombination(null);
    setCombinations([]);
    setCurrentCombinationIndex(0);
    // Seçili kombinasyonu sıfırla
    setFilteredCombinations([]);
  };

  const handleScreenshot = async () => {
    if (scheduleRef.current) {
      try {
        const canvas = await html2canvas(scheduleRef.current, {
          backgroundColor: theme.colors.surface,
          scale: 2, // Daha yüksek kalite için
        });
        
        // Canvas'ı PNG olarak kaydet
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = 'ders-programi.png';
        link.click();
        
        // Başarı mesajı göster
        setAlertMessage('Program başarıyla kaydedildi!');
        setAlertSeverity('success');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      } catch (error) {
        console.error('Screenshot error:', error);
        setAlertMessage('Program kaydedilirken bir hata oluştu.');
        setAlertSeverity('error');
        setShowAlert(true);
      }
    }
  };

  const handlePrevCombination = () => {
    setCurrentCombinationIndex(prev => 
      prev > 0 ? prev - 1 : filteredCombinations.length - 1
    );
  };

  const handleNextCombination = () => {
    setCurrentCombinationIndex(prev => 
      prev < filteredCombinations.length - 1 ? prev + 1 : 0
    );
  };

  return (
    <Container maxWidth={false} sx={{ 
      mt: 2, 
      mb: 2, 
      px: { xs: 1, sm: 2, md: 4 },
      backgroundColor: theme.colors.background,
      minHeight: '100vh',
      height: '98vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      '@keyframes fadeIn': {
        '0%': {
          opacity: 0,
          transform: 'translateY(20px)'
        },
        '100%': {
          opacity: 1,
          transform: 'translateY(0)'
        }
      },
      animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Son Güncelleme Tarihi */}
      <Box sx={{
        position: 'absolute',
        top: 12,
        right: 16,
        px: 1.5,
        py: 0.5,
        borderRadius: '999px',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        backgroundColor: 'rgba(255,255,255,0.6)',
        backdropFilter: 'saturate(160%) blur(8px)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.06)'
      }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.colors.secondary }} />
        <Typography sx={{
          fontSize: '0.7rem',
          color: theme.colors.text.secondary,
          fontWeight: 600
        }}>
          Güncellendi: {lastUpdated}
        </Typography>
      </Box>

      {/* Header Section */}
      <Box sx={{
        position: 'relative',
        zIndex: 1,
        mb: 1,
        textAlign: 'center',
        '@keyframes slideDown': {
          '0%': { transform: 'translateY(-20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        },
        animation: 'slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <Typography variant="h3" sx={{
          fontWeight: 800,
          fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
          mb: 0.5,
          fontFamily: '"Poppins", sans-serif',
          position: 'relative',
          display: 'inline-block',
          backgroundImage: theme.gradients.mixed,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -2,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '30px',
            height: '3px',
            background: theme.gradients.mixed,
            borderRadius: '2px',
            transition: theme.transitions.default
          },
          '&:hover::after': {
            width: '100px'
          }
        }}>
          TEDU Ders Planlayıcı
        </Typography>
        <Box sx={{
          mt: 1,
          mx: 'auto',
          width: '100%',
          maxWidth: 920,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          backgroundColor: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: '999px',
          backdropFilter: 'saturate(160%) blur(8px)'
        }}>
          <Typography sx={{ fontSize: '0.8rem', color: theme.colors.text.secondary }}>
            İpuçları:
          </Typography>
          <Box sx={{
            px: 1,
            py: 0.3,
            fontSize: '0.75rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(0,35,121,0.08)',
            border: '1px solid rgba(0,35,121,0.15)'
          }}>
            ← / → kombinasyonlar arasında geçiş
          </Box>
          <Box sx={{
            px: 1,
            py: 0.3,
            fontSize: '0.75rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(212,46,18,0.08)',
            border: '1px solid rgba(212,46,18,0.15)'
          }}>
            Alt + R tüm seçimleri temizler
          </Box>
          <Box sx={{
            px: 1,
            py: 0.3,
            fontSize: '0.75rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            Hücreye tıklayarak zaman blokla
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Grid container spacing={2} sx={{ flex: 1, height: 'calc(100% - 100px)' }}>
        {/* Left Panel: Course Search and Selection */}
        <Grid item xs={12} md={3} sx={{ height: '100%' }}>
          <Paper elevation={0} sx={{
            p: 2,
            backgroundColor: 'rgba(255,255,255,0.75)',
            backdropFilter: 'saturate(160%) blur(10px)',
            borderRadius: theme.borderRadius.large,
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
            transition: theme.transitions.default,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Search Box */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ders Ara (Kod veya İsim)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: theme.colors.text.secondary, mr: 1 }} />
                  ),
                  sx: {
                    borderRadius: '999px',
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'saturate(160%) blur(8px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.85)' },
                    '&.Mui-focused': { boxShadow: '0 10px 24px rgba(0,0,0,0.10)' },
                    '& fieldset': { borderColor: 'rgba(0,0,0,0.06)' }
                  }
                }}
              />
            </Box>

            {/* Course List */}
            <Box sx={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '650px',
              pr: 1,
              '&::-webkit-scrollbar': {
                width: '6px'
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0.05)',
                borderRadius: '3px'
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.colors.primary,
                borderRadius: '3px',
                opacity: 0.5,
                '&:hover': {
                  opacity: 0.7
                }
              }
            }}>
              {filteredCourses
                .filter((course, index, self) => 
                  index === self.findIndex(c => c.Code === course.Code)
                )
                .map((course, index) => (
                  <Box
                    key={index}
                    onClick={() => handleCourseSelect(course)}
                    sx={{
                      p: 1.5,
                      mb: 0.5,
                      borderRadius: theme.borderRadius.small,
                      background: selectedCourseCodes.includes(course.Code)
                        ? `linear-gradient(90deg, ${courseColors[course.Code]}22, ${courseColors[course.Code]}11)`
                        : 'linear-gradient(90deg, rgba(0,0,0,0.02), rgba(0,0,0,0))',
                      cursor: 'pointer',
                      transition: theme.transitions.fast,
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderLeft: selectedCourseCodes.includes(course.Code) 
                        ? `4px solid ${courseColors[course.Code]}` 
                        : '4px solid transparent',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      '&:hover': {
                        transform: 'translateX(2px)',
                        background: selectedCourseCodes.includes(course.Code)
                          ? `linear-gradient(90deg, ${courseColors[course.Code]}33, ${courseColors[course.Code]}11)`
                          : 'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0))',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{
                        fontWeight: 600,
                        color: theme.colors.text.primary,
                        fontSize: '0.85rem',
                        lineHeight: 1.2,
                        mb: 0.25
                      }}>
                        {course.Code}
                      </Typography>
                      <Typography sx={{
                        fontSize: '0.75rem',
                        color: theme.colors.text.secondary,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {course.Name}
                      </Typography>
                    </Box>
                    <Box sx={{
                      ml: 1,
                      px: 0.75,
                      py: 0.25,
                      fontSize: '0.65rem',
                      borderRadius: '999px',
                      backgroundColor: `${courseColors[course.Code] || theme.colors.primary}22`,
                      border: '1px solid rgba(0,0,0,0.06)',
                      minWidth: '32px',
                      textAlign: 'center',
                      fontWeight: 600
                    }}>
                      {courses.filter(c => c.Code === course.Code).length}
                    </Box>
                  </Box>
                ))}
            </Box>
          </Paper>
        </Grid>

        {/* Center Panel: Weekly Schedule */}
        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
          <Paper elevation={0} sx={{
            backgroundColor: 'rgba(255,255,255,0.75)',
            backdropFilter: 'saturate(160%) blur(10px)',
            borderRadius: theme.borderRadius.large,
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Schedule Header */}
            <Box sx={{
              p: 1.5,
              background: theme.gradients.mixed,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: 'column',
              gap: 1
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
              }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Typography sx={{
                    color: theme.colors.text.light,
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}>
                    Haftalık Program
                  </Typography>
                  <Button
                    size="small"
                    variant={allowConflicts ? "contained" : "outlined"}
                    onClick={() => setAllowConflicts(!allowConflicts)}
                    sx={{
                      minWidth: 'auto',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      borderRadius: theme.borderRadius.medium,
                      backgroundColor: allowConflicts ? 'rgba(255,255,255,0.2)' : 'transparent',
                      borderColor: 'rgba(255,255,255,0.5)',
                      color: theme.colors.text.light,
                      '&:hover': {
                        backgroundColor: allowConflicts ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    {allowConflicts ? "Çakışmalara İzin Veriliyor" : "Çakışmalara İzin Ver"}
                  </Button>
                </Box>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  {/* Ekran görüntüsü alma butonu */}
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleScreenshot}
                    sx={{
                      minWidth: 'auto',
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      borderRadius: theme.borderRadius.medium,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: theme.colors.text.light,
                      boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.28)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Programı Kaydet
                  </Button>
                  {filteredCombinations.length > 0 ? (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      padding: '2px 8px'
                    }}>
                      <IconButton
                        size="small"
                        onClick={handlePrevCombination}
                        sx={{
                          padding: '4px',
                          color: theme.colors.text.light,
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)'
                          }
                        }}
                      >
                        <ArrowBack fontSize="small" />
                      </IconButton>
                      <Typography sx={{
                        color: theme.colors.text.light,
                        fontWeight: 500,
                        fontSize: '0.85rem'
                      }}>
                        {currentCombinationIndex + 1} / {filteredCombinations.length}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={handleNextCombination}
                        sx={{
                          padding: '4px',
                          color: theme.colors.text.light,
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)'
                          }
                        }}
                      >
                        <ArrowForward fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : combinations.length > 0 ? (
                    <Typography sx={{
                      color: theme.colors.text.light,
                      fontSize: '0.85rem',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      padding: '4px 12px'
                    }}>
                      Uygun kombinasyon bulunamadı
                    </Typography>
                  ) : null}
                </Box>
              </Box>
              
              {/* Boş Gün Seçici */}
              <EmptyDaySelector />
            </Box>

            {/* Schedule Table - ref eklendi */}
            <Box ref={scheduleRef} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{
                flex: 1,
                height: 'calc(100% - 52px)',
                '&::-webkit-scrollbar': {
                  width: '6px',
                  height: '6px'
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.05)'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.colors.primary,
                  borderRadius: '3px',
                  opacity: 0.5,
                  '&:hover': {
                    opacity: 0.7
                  }
                }
              }}>
                <Table size="small" stickyHeader sx={{ 
                  height: '100%',
                  tableLayout: 'fixed',
                  minWidth: 'auto'
                }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{
                        background: 'rgba(0,35,121,0.85)',
                        backdropFilter: 'saturate(160%) blur(6px)',
                        color: theme.colors.text.light,
                        fontWeight: 700,
                        letterSpacing: 0.2,
                        textAlign: 'center',
                        width: '60px',
                        minWidth: '60px',
                        position: 'sticky',
                        left: 0,
                        zIndex: 3,
                        padding: '6px 2px',
                        fontSize: '0.72rem',
                        borderBottom: '1px solid rgba(255,255,255,0.25)'
                      }}>
                        Saat
                      </TableCell>
                      {DAYS.map(day => (
                        <TableCell key={day} sx={{
                          background: 'rgba(0,35,121,0.85)',
                          backdropFilter: 'saturate(160%) blur(6px)',
                          color: theme.colors.text.light,
                          fontWeight: 700,
                          letterSpacing: 0.2,
                          textAlign: 'center',
                          padding: '6px 2px',
                          fontSize: '0.72rem',
                          width: 'calc((100% - 60px) / 6)',
                          minWidth: '90px',
                          borderBottom: '1px solid rgba(255,255,255,0.25)'
                        }}>
                          {day}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {HOURS.map(hour => (
                      <TableRow key={hour}>
                        <TableCell sx={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 2,
                          background: theme.colors.surface,
                          fontWeight: 500,
                          textAlign: 'center',
                          borderRight: '1px solid rgba(0,0,0,0.1)',
                          padding: '2px',
                          height: '40px',
                          fontSize: '0.75rem'
                        }}>
                          {`${hour}:00`}
                        </TableCell>
                        {DAYS.map(day => (
                          <TableCell
                            key={day}
                            onClick={() => handleTimeSlotClick(day, hour)}
                            sx={{
                              padding: '2px',
                              height: '40px',
                              border: '1px solid rgba(0,0,0,0.1)',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: theme.transitions.fast,
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.02)',
                                outline: '2px solid rgba(0,35,121,0.15)',
                                outlineOffset: '-2px'
                              }
                            }}
                          >
                            {blockedTimeSlots.includes(`${day}-${hour}`) && (
                              <Box sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.75) 100%)',
                                backdropFilter: 'saturate(160%) blur(2px)',
                                zIndex: 1,
                                border: '1px dashed rgba(212,46,18,0.35)'
                              }}>
                                <CloseIcon sx={{ 
                                  color: theme.colors.secondary,
                                  fontSize: '1.2rem',
                                  opacity: 0.7
                                }} />
                              </Box>
                            )}
                            {renderTimeSlot(day, hour, filteredCombinations[currentCombinationIndex] || [])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Analytics />
          </Paper>
        </Grid>

        {/* Right Panel: Selected Courses and Filters */}
        <Grid item xs={12} md={3} sx={{ height: '100%' }}>
          <Paper elevation={0} sx={{
            p: 2,
            backgroundColor: 'rgba(255,255,255,0.75)',
            backdropFilter: 'saturate(160%) blur(10px)',
            borderRadius: theme.borderRadius.large,
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              height: '100%'
            }}>
              <Typography variant="h6" sx={{
                color: theme.colors.text.primary,
                fontWeight: 600,
                fontSize: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                Seçilen Dersler
                {selectedCourseCodes.length > 0 && (
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    onClick={handleRemoveAllCourses}
                    sx={{
                      minWidth: 'auto',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: `${theme.colors.secondary}11`
                      }
                    }}
                  >
                    Tümünü Kaldır
                  </Button>
                )}
              </Typography>

              {selectedCourseCodes.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={generateAllPossibleCombinations}
                    startIcon={<AutorenewIcon />}
                    size="small"
                    sx={{
                      background: theme.gradients.mixed,
                      borderRadius: theme.borderRadius.medium,
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows.medium
                      }
                    }}
                  >
                    Kombinasyonları Oluştur ({selectedCourseCodes.length})
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setShowFilters(!showFilters)}
                    startIcon={showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
                    size="small"
                    sx={{
                      borderRadius: theme.borderRadius.medium,
                      borderWidth: '2px',
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        borderWidth: '2px',
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows.small
                      }
                    }}
                  >
                    {showFilters ? "Filtreleri Gizle" : "Filtreleri Göster"}
                  </Button>
                </Box>
              )}

              <Box sx={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                '&::-webkit-scrollbar': {
                  width: '6px'
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '3px'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.colors.primary,
                  borderRadius: '3px',
                  opacity: 0.5,
                  '&:hover': {
                    opacity: 0.7
                  }
                }
              }}>
                {/* Selected Courses */}
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  {selectedCourseCodes.map(code => {
                    const course = courses.find(c => c.Code === code);
                    return (
                      <Chip
                        key={code}
                        label={`${code} - ${course?.Name}`}
                        onDelete={() => handleCourseRemove(code)}
                        size="small"
                        sx={{
                          background: `linear-gradient(180deg, ${courseColors[code]}22, ${courseColors[code]}11)`,
                          color: theme.colors.text.primary,
                          fontWeight: 600,
                          letterSpacing: 0.2,
                          borderRadius: '12px',
                          border: '1px solid rgba(0,0,0,0.06)',
                          boxShadow: '0 6px 14px rgba(0,0,0,0.04)',
                          '& .MuiChip-deleteIcon': {
                            color: theme.colors.text.primary,
                            '&:hover': {
                              color: theme.colors.secondary
                            }
                          },
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            background: `linear-gradient(180deg, ${courseColors[code]}33, ${courseColors[code]}11)`
                          }
                        }}
                      />
                    );
                  })}
                </Box>

                {/* Filters */}
                {showFilters && selectedCourseCodes.length > 0 && (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    mt: 2
                  }}>
                    {selectedCourseCodes.map(code => renderFilters(code))}
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Course Info Popover */}
      <Popover
        open={Boolean(courseInfoAnchorEl)}
        anchorEl={courseInfoAnchorEl}
        onClose={() => {
          setCourseInfoAnchorEl(null);
          setSelectedCourseInfo(null);
        }}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPopover-paper': {
            borderRadius: theme.borderRadius.large,
            overflow: 'hidden',
            width: '320px',
            animation: 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }
        }}
      >
        {selectedCourseInfo && (
          <Box>
            <Box sx={{
              p: 2,
              background: theme.gradients.mixed,
              color: theme.colors.text.light
            }}>
              <Typography variant="h6" sx={{
                fontSize: '1.1rem',
                fontWeight: 700,
                mb: 1
              }}>
                {selectedCourseInfo.Code}
              </Typography>
              <Typography variant="body2" sx={{
                fontSize: '0.9rem',
                opacity: 0.9
              }}>
                {selectedCourseInfo.Name}
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{
                    color: theme.colors.text.secondary,
                    display: 'block',
                    mb: 0.5
                  }}>
                    Section
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedCourseInfo.Section}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{
                    color: theme.colors.text.secondary,
                    display: 'block',
                    mb: 0.5
                  }}>
                    Öğretim Üyesi
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedCourseInfo.Lecturer}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{
                    color: theme.colors.text.secondary,
                    display: 'block',
                    mb: 0.5
                  }}>
                    Kredi
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedCourseInfo.Cr}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{
                    color: theme.colors.text.secondary,
                    display: 'block',
                    mb: 0.5
                  }}>
                    AKTS
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedCourseInfo.ECTS}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{
                    color: theme.colors.text.secondary,
                    display: 'block',
                    mb: 0.5
                  }}>
                    Derslik
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedCourseInfo.Room}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{
                    color: theme.colors.text.secondary,
                    display: 'block',
                    mb: 0.5
                  }}>
                    Zaman
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedCourseInfo.Schedule}
                  </Typography>
                </Grid>
              </Grid>
              <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={() => {
                  handleCourseRemove(selectedCourseInfo.Code);
                  setCourseInfoAnchorEl(null);
                  setSelectedCourseInfo(null);
                }}
                sx={{
                  mt: 2,
                  borderRadius: theme.borderRadius.medium,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Dersi Kaldır
              </Button>
            </Box>
          </Box>
        )}
      </Popover>

      {/* Alert */}
      {showAlert && (
        <Alert
          severity={alertSeverity}
          sx={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            minWidth: '300px',
            borderRadius: theme.borderRadius.large,
            boxShadow: theme.shadows.large,
            animation: 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            },
            '& .MuiAlert-message': {
              fontSize: '0.95rem',
              fontWeight: 500
            }
          }}
        >
          {alertMessage}
        </Alert>
      )}
      {selectedCourseCodes.length > 0 && (
        <Box sx={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 1100
        }}>
          <Button
            onClick={generateAllPossibleCombinations}
            startIcon={<AutorenewIcon />}
            variant="contained"
            sx={{
              px: 2.2,
              py: 1.2,
              borderRadius: '999px',
              background: theme.gradients.mixed,
              boxShadow: '0 14px 30px rgba(0,0,0,0.15)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.20)'
              }
            }}
          >
            Kombinasyonları Oluştur
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default App;
