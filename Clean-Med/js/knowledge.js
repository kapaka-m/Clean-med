/* Curated demonstration rules, retained from the original academic project.
 * These records have not been clinically validated. */
(function (root) {
  'use strict';
  const conditions = [
    {
      id: 'influenza',
      name: 'Influenza',
      category: 'Respiratory',
      symptoms: ['Fever', 'Cough', 'Sore throat', 'Fatigue', 'Headache', 'Muscle pain'],
      description:
        'A viral infection affecting the respiratory system, commonly associated with fever and fatigue.',
    },
    {
      id: 'common-cold',
      name: 'Common cold',
      category: 'Respiratory',
      symptoms: ['Runny nose', 'Sneezing', 'Nasal congestion', 'Cough', 'Sore throat'],
      description: 'A common viral infection that mainly affects the nose and throat.',
    },
    {
      id: 'covid-19',
      name: 'COVID-19',
      category: 'Respiratory',
      symptoms: [
        'Fever',
        'Cough',
        'Fatigue',
        'Loss of smell',
        'Shortness of breath',
        'Sore throat',
      ],
      description: 'A viral infection that can affect the respiratory system and sense of smell.',
    },
    {
      id: 'migraine',
      name: 'Migraine',
      category: 'Neurological',
      symptoms: ['Headache', 'Nausea', 'Light sensitivity', 'Dizziness', 'Blurred vision'],
      description:
        'A headache condition that may be associated with nausea, light sensitivity, and visual disturbances.',
    },
    {
      id: 'gastritis',
      name: 'Gastritis',
      category: 'Digestive',
      symptoms: ['Abdominal pain', 'Nausea', 'Vomiting', 'Heartburn', 'Loss of appetite'],
      description:
        'Inflammation or irritation of the stomach lining, associated with digestive discomfort.',
    },
    {
      id: 'food-poisoning',
      name: 'Food poisoning',
      category: 'Digestive',
      symptoms: ['Abdominal pain', 'Diarrhea', 'Vomiting', 'Nausea', 'Fever'],
      description:
        'An illness caused by contaminated food or drink, often associated with digestive symptoms.',
    },
    {
      id: 'sinusitis',
      name: 'Sinusitis',
      category: 'Respiratory',
      symptoms: ['Headache', 'Nasal congestion', 'Facial pain', 'Runny nose', 'Fever'],
      description: 'Inflammation of the sinuses that may cause facial pressure and headache.',
    },
    {
      id: 'seasonal-allergy',
      name: 'Seasonal allergy',
      category: 'Respiratory',
      symptoms: ['Sneezing', 'Runny nose', 'Itchy eyes', 'Nasal congestion', 'Watery eyes'],
      description: 'An allergic response to environmental triggers such as pollen or dust.',
    },
    {
      id: 'bronchitis',
      name: 'Bronchitis',
      category: 'Respiratory',
      symptoms: ['Cough', 'Shortness of breath', 'Fatigue', 'Fever', 'Chest wheezing'],
      description:
        'Inflammation of the bronchial tubes, associated with coughing and breathing discomfort.',
    },
    {
      id: 'throat-infection',
      name: 'Sore throat infection',
      category: 'Respiratory',
      symptoms: ['Sore throat', 'Fever', 'Difficulty swallowing', 'Fatigue', 'Swollen tonsils'],
      description: 'An infection or inflammation of the throat that can make swallowing painful.',
    },
    {
      id: 'anemia',
      name: 'Anemia',
      category: 'General',
      symptoms: ['Fatigue', 'Dizziness', 'Pale skin', 'Shortness of breath', 'Headache'],
      description:
        'A condition involving low red blood cells or hemoglobin, often associated with fatigue and dizziness.',
    },
    {
      id: 'dehydration',
      name: 'Dehydration',
      category: 'General',
      symptoms: ['Severe thirst', 'Dizziness', 'Dry mouth', 'Fatigue', 'Low urination'],
      description: 'A lack of body fluids that can affect energy and normal body functions.',
    },
  ];
  const groups = {
    Respiratory: [
      'Cough',
      'Sore throat',
      'Runny nose',
      'Sneezing',
      'Nasal congestion',
      'Loss of smell',
      'Shortness of breath',
      'Chest wheezing',
      'Difficulty swallowing',
      'Swollen tonsils',
    ],
    Digestive: [
      'Abdominal pain',
      'Nausea',
      'Vomiting',
      'Heartburn',
      'Loss of appetite',
      'Diarrhea',
    ],
    Neurological: ['Headache', 'Light sensitivity', 'Dizziness', 'Blurred vision'],
    General: [
      'Fever',
      'Fatigue',
      'Muscle pain',
      'Facial pain',
      'Itchy eyes',
      'Watery eyes',
      'Pale skin',
      'Severe thirst',
      'Dry mouth',
      'Low urination',
    ],
  };
  const samples = [
    {
      id: 'respiratory',
      name: 'Respiratory symptoms',
      description: 'Fever, cough, fatigue & sore throat',
      symptoms: ['Fever', 'Cough', 'Fatigue', 'Sore throat'],
    },
    {
      id: 'digestive',
      name: 'Digestive symptoms',
      description: 'Abdominal pain, nausea & vomiting',
      symptoms: ['Abdominal pain', 'Nausea', 'Vomiting'],
    },
    {
      id: 'headache',
      name: 'Headache & sensitivity',
      description: 'Headache, nausea & light sensitivity',
      symptoms: ['Headache', 'Nausea', 'Light sensitivity'],
    },
  ];
  conditions.forEach((item) => {
    Object.freeze(item.symptoms);
    Object.freeze(item);
  });
  Object.values(groups).forEach(Object.freeze);
  samples.forEach((item) => {
    Object.freeze(item.symptoms);
    Object.freeze(item);
  });
  const data = Object.freeze({
    conditions: Object.freeze(conditions),
    groups: Object.freeze(groups),
    samples: Object.freeze(samples),
    version: '1.0.0',
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.CleanMedKnowledge = data;
})(globalThis);
