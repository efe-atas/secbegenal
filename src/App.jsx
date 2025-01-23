import { useState, useEffect } from 'react';
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
  Alert
} from '@mui/material';
import { 
  ArrowBack, 
  ArrowForward, 
  Search as SearchIcon, 
  Autorenew as AutorenewIcon,
  FilterList as FilterListIcon,
  FilterListOff as FilterListOffIcon
} from '@mui/icons-material';
import Papa from 'papaparse';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9); // 9:00 - 21:00

// Renk paleti tanımlamaları
const COURSE_COLORS = [
  '#D42E12', // TED Kırmızı
  '#002379', // TED Lacivert
  '#F7D417', // TED Sarı
  '#D42E12CC', // TED Kırmızı (80% opaklık)
  '#002379CC', // TED Lacivert (80% opaklık)
  '#F7D417CC', // TED Sarı (80% opaklık)
  '#D42E1299', // TED Kırmızı (60% opaklık)
  '#00237999', // TED Lacivert (60% opaklık)
  '#F7D41799', // TED Sarı (60% opaklık)
  '#D42E1266', // TED Kırmızı (40% opaklık)
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

  useEffect(() => {
    // CSV dosyasını oku
    fetch('/Courses.csv')
      .then(response => response.text())
      .then(csvData => {
        const results = Papa.parse(csvData, { header: true });
        const courseData = results.data.filter(course => course.Code && course.Name); // Boş satırları filtrele
        setCourses(courseData);
        setFilteredCourses(courseData);

        // Benzersiz hocaları ve sectionları çıkar
        const uniqueLecturers = [...new Set(courseData.map(course => course.Lecturer))].filter(Boolean);
        const uniqueSections = [...new Set(courseData.map(course => course.Section))].filter(Boolean);
        setLecturers(uniqueLecturers);
        setSections(uniqueSections);
      })
      .catch(error => {
        console.error('CSV okuma hatası:', error);
      });
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
      let sections = courses.filter(c => c.Code === code);
      
      if (courseFilters[code]) {
        const { lecturer, section } = courseFilters[code];
        if (lecturer) {
          sections = sections.filter(c => c.Lecturer === lecturer);
        }
        if (section) {
          sections = sections.filter(c => c.Section === section);
        }
      }
      
      courseSectionsMap[code] = sections;
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
    if (!selectedCourseCodes.includes(course.Code)) {
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
        const courseSectionsMap = {};
        remainingCourses.forEach(code => {
          courseSectionsMap[code] = courses.filter(c => c.Code === code);
        });

        let allCombinations = [[]];
        Object.values(courseSectionsMap).forEach(sections => {
          const newCombinations = [];
          allCombinations.forEach(combo => {
            sections.forEach(section => {
              const newCombo = [...combo, section];
              let hasConflict = false;
              for (let i = 0; i < newCombo.length; i++) {
                for (let j = i + 1; j < newCombo.length; j++) {
                  if (checkTimeConflict(
                    parseSchedule(newCombo[i].Schedule),
                    parseSchedule(newCombo[j].Schedule)
                  )) {
                    hasConflict = true;
                    break;
                  }
                }
                if (hasConflict) break;
              }
              if (!hasConflict) {
                newCombinations.push(newCombo);
              }
            });
          });
          allCombinations = newCombinations;
        });

        setCombinations(allCombinations);
      }, 0);
    }
  };

  // Ders seçildiğinde renk atama
  const assignCourseColor = (courseCode) => {
    if (!courseColors[courseCode]) {
      const usedColors = Object.values(courseColors);
      const availableColors = COURSE_COLORS.filter(color => !usedColors.includes(color));
      const randomColor = availableColors[0] || COURSE_COLORS[0];
      setCourseColors(prev => ({ ...prev, [courseCode]: randomColor }));
    }
  };

  const renderTimeSlot = (day, hour, courses) => {
    if (!courses || courses.length === 0) {
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
                backgroundColor: `${courseColors[course.Code]}33`,
                padding: '2px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontFamily: '"Inter", sans-serif',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  backgroundColor: `${courseColors[course.Code]}55`,
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
                  fontWeight: 500,
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

  const getFilteredCombinations = () => {
    if (!combinations.length) return [];
    
    return combinations.filter(combo => {
      // Önce mevcut filtreleri kontrol et
      for (const courseCode in courseFilters) {
        const course = combo.find(c => c.Code === courseCode);
        if (!course) continue;

        const filter = courseFilters[courseCode];
        if (filter.lecturer && course.Lecturer !== filter.lecturer) return false;
        if (filter.section && course.Section !== filter.section) return false;
      }

      // Sonra bloklanmış zaman dilimlerini kontrol et
      if (blockedTimeSlots.length > 0) {
        for (const course of combo) {
          const schedules = parseSchedule(course.Schedule);
          for (const schedule of schedules) {
            for (let hour = schedule.start; hour < schedule.end; hour++) {
              const timeSlot = `${schedule.day}-${hour}`;
              if (blockedTimeSlots.includes(timeSlot)) {
                return false;
              }
            }
          }
        }
      }

      return true;
    });
  };

  const filteredCombinations = getFilteredCombinations();

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

  // Filtreleme bileşenleri için gerekli fonksiyonlar
  const getUniqueLecturers = (courseCode) => {
    return [...new Set(courses
      .filter(c => c.Code === courseCode)
      .map(c => c.Lecturer))]
      .filter(Boolean)
      .sort();
  };

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
        newFilters[courseCode] = {};
      }

      if (type === 'lecturer') {
        const selectedLecturer = value;
        if (selectedLecturer) {
          // Öğretim üyesi seçildiğinde
          newFilters[courseCode].lecturer = selectedLecturer;
          
          // Mevcut section'ın bu öğretim üyesine ait olup olmadığını kontrol et
          const currentSection = newFilters[courseCode]?.section;
          if (currentSection) {
            const isValidSection = courses.some(c => 
              c.Code === courseCode && 
              c.Lecturer === selectedLecturer && 
              c.Section === currentSection
            );
            if (!isValidSection) {
              // Eğer section bu öğretim üyesine ait değilse, section'ı temizle
              newFilters[courseCode].section = '';
            }
          }
        } else {
          // "Tümü" seçildiğinde sadece öğretim üyesini temizle
          newFilters[courseCode].lecturer = '';
        }
      } else if (type === 'section') {
        const selectedSection = value;
        if (selectedSection) {
          // Section seçildiğinde
          const course = courses.find(c => c.Code === courseCode && c.Section === selectedSection);
          if (course) {
            // Section'a ait öğretim üyesini otomatik seç
            newFilters[courseCode].section = selectedSection;
            newFilters[courseCode].lecturer = course.Lecturer;
          }
        } else {
          // "Tümü" seçildiğinde sadece section'ı temizle
          newFilters[courseCode].section = '';
        }
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
    const filters = courseFilters[code] || {};
    const lecturers = getUniqueLecturers(code);
    const sections = getUniqueSections(code, filters.lecturer);

    return (
      <Paper key={code} elevation={0} sx={{
        p: 2,
        borderRadius: theme.borderRadius.medium,
        border: '1px solid rgba(0,0,0,0.1)',
        backgroundColor: `${courseColors[code]}11`
      }}>
        <Typography sx={{
          fontWeight: 600,
          mb: 2,
          color: theme.colors.text.primary
        }}>
          {code} - {course?.Name}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Öğretim Üyesi</InputLabel>
              <Select
                value={filters.lecturer || ''}
                label="Öğretim Üyesi"
                onChange={(e) => handleCourseFilter(code, 'lecturer', e.target.value)}
                sx={{
                  borderRadius: theme.borderRadius.small,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0,0,0,0.1)'
                  }
                }}
              >
                <MenuItem value="">Tümü</MenuItem>
                {lecturers.map(lecturer => (
                  <MenuItem key={lecturer} value={lecturer}>
                    {lecturer}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Section</InputLabel>
              <Select
                value={filters.section || ''}
                label="Section"
                onChange={(e) => handleCourseFilter(code, 'section', e.target.value)}
                sx={{
                  borderRadius: theme.borderRadius.small,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0,0,0,0.1)'
                  }
                }}
              >
                <MenuItem value="">Tümü</MenuItem>
                {sections.map(section => {
                  const sectionInfo = courses.find(c => c.Code === code && c.Section === section);
                  return (
                    <MenuItem key={section} value={section}>
                      {section} - {sectionInfo?.Lecturer}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
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
          color: theme.colors.primary,
          fontWeight: 800,
          fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
          mb: 0.5,
          fontFamily: '"Poppins", sans-serif',
          position: 'relative',
          display: 'inline-block',
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
          TEDU Ders Programı
        </Typography>
      </Box>

      {/* Main Content */}
      <Grid container spacing={2} sx={{ flex: 1, height: 'calc(100% - 100px)' }}>
        {/* Left Panel: Course Search and Selection */}
        <Grid item xs={12} md={3} sx={{ height: '100%' }}>
          <Paper elevation={0} sx={{
            p: 2,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.large,
            border: '1px solid rgba(0,0,0,0.1)',
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
                    borderRadius: theme.borderRadius.medium,
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.04)'
                    },
                    '& fieldset': {
                      borderColor: 'rgba(0,0,0,0.1)'
                    }
                  }
                }}
              />
            </Box>

            {/* Course List */}
            <Box sx={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '650px', // Maksimum yüksekliği artırdım
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
                      p: 2,
                      mb: 1,
                      borderRadius: theme.borderRadius.medium,
                      backgroundColor: selectedCourseCodes.includes(course.Code)
                        ? `${courseColors[course.Code]}22`
                        : 'transparent',
                      cursor: 'pointer',
                      transition: theme.transitions.fast,
                      border: '1px solid rgba(0,0,0,0.1)',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        backgroundColor: selectedCourseCodes.includes(course.Code)
                          ? `${courseColors[course.Code]}33`
                          : 'rgba(0,0,0,0.02)',
                        boxShadow: theme.shadows.small
                      }
                    }}
                  >
                    <Typography sx={{
                      fontWeight: 600,
                      color: theme.colors.text.primary,
                      fontSize: '0.9rem',
                      mb: 0.5
                    }}>
                      {course.Code}
                    </Typography>
                    <Typography sx={{
                      fontSize: '0.8rem',
                      color: theme.colors.text.secondary
                    }}>
                      {course.Name}
                    </Typography>
                  </Box>
                ))}
            </Box>
          </Paper>
        </Grid>

        {/* Center Panel: Weekly Schedule */}
        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
          <Paper elevation={0} sx={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.large,
            border: '1px solid rgba(0,0,0,0.1)',
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
              justifyContent: 'space-between'
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
              {filteredCombinations.length > 0 && (
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
              )}
            </Box>

            {/* Schedule Table */}
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
                      background: theme.gradients.primary,
                      color: theme.colors.text.light,
                      fontWeight: 600,
                      textAlign: 'center',
                      width: '60px',
                      minWidth: '60px',
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      padding: '6px 2px',
                      fontSize: '0.75rem'
                    }}>
                      Saat
                    </TableCell>
                    {DAYS.map(day => (
                      <TableCell key={day} sx={{
                        background: theme.gradients.primary,
                        color: theme.colors.text.light,
                        fontWeight: 600,
                        textAlign: 'center',
                        padding: '6px 2px',
                        fontSize: '0.75rem',
                        width: 'calc((100% - 60px) / 6)',
                        minWidth: '90px'
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
                            backgroundColor: blockedTimeSlots.includes(`${day}-${hour}`)
                              ? `${theme.colors.secondary}11`
                              : 'transparent',
                            transition: theme.transitions.fast,
                            '&:hover': {
                              backgroundColor: blockedTimeSlots.includes(`${day}-${hour}`)
                                ? `${theme.colors.secondary}22`
                                : 'rgba(0,0,0,0.02)'
                            }
                          }}
                        >
                          {renderTimeSlot(day, hour, filteredCombinations[currentCombinationIndex] || [])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Right Panel: Selected Courses and Filters */}
        <Grid item xs={12} md={3} sx={{ height: '100%' }}>
          <Paper elevation={0} sx={{
            p: 2,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.large,
            border: '1px solid rgba(0,0,0,0.1)',
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
                          backgroundColor: `${courseColors[code]}22`,
                          color: theme.colors.text.primary,
                          fontWeight: 500,
                          borderRadius: theme.borderRadius.medium,
                          '& .MuiChip-deleteIcon': {
                            color: theme.colors.text.primary,
                            '&:hover': {
                              color: theme.colors.secondary
                            }
                          },
                          '&:hover': {
                            backgroundColor: `${courseColors[code]}33`
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
    </Container>
  );
}

export default App;
