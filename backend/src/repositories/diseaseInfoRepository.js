const db = require('../models');

class DiseaseInfoRepository {
  async findByDiseaseKey(key) {
    if (!db.connected) return null;
    return db.DiseaseInfo.findOne({ where: { disease_key: key } });
  }

  async findAll() {
    if (!db.connected) return [];
    return db.DiseaseInfo.findAll({ order: [['display_name', 'ASC']] });
  }

  async matchBest(diseaseKey, availableKeys) {
    if (!db.connected) return null;
    const exact = await this.findByDiseaseKey(diseaseKey);
    if (exact) return exact;
    const lowerKey = diseaseKey.toLowerCase().replace(/[\s_-]/g, '');
    const all = availableKeys || (await db.DiseaseInfo.findAll({ attributes: ['disease_key'] }));
    for (const d of all) {
      const k = (typeof d === 'string' ? d : d.disease_key);
      if (k.toLowerCase().replace(/[\s_-]/g, '') === lowerKey) {
        return this.findByDiseaseKey(k);
      }
    }
    return null;
  }
}

module.exports = new DiseaseInfoRepository();
