const db = require('../models');
const AppError = require('../utils/AppError');

class UserRepository {
  async create(userData) {
    return db.User.create(userData);
  }

  async findByEmail(email) {
    return db.User.findOne({ where: { email } });
  }

  async findById(id) {
    return db.User.findByPk(id);
  }

  async findByResetTokenHash(tokenHash) {
    if (!db.connected) return null;
    const { Op } = db.Sequelize;
    return db.User.findOne({
      where: {
        reset_password_token_hash: tokenHash,
        reset_password_expires_at: { [Op.gt]: new Date() },
        reset_password_used: false,
      },
    });
  }

  async updateStats(userId, isHealthy) {
    if (!db.connected) return null;
    const user = await db.User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    user.total_scans = (user.total_scans || 0) + 1;
    if (isHealthy) {
      user.healthy_count = (user.healthy_count || 0) + 1;
    } else {
      user.disease_count = (user.disease_count || 0) + 1;
    }
    await user.save();
    return user;
  }

  async updateLastLogin(userId) {
    if (!db.connected) return null;
    return db.User.update(
      { last_login_at: new Date() },
      { where: { id: userId } }
    );
  }

  async changePassword(userId, newPasswordHash) {
    if (!db.connected) throw new AppError('Database not available', 503);
    const user = await db.User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    user.password_hash = newPasswordHash;
    user.reset_password_token_hash = null;
    user.reset_password_expires_at = null;
    user.reset_password_used = false;
    await user.save();
    return user;
  }

  async setResetToken(userId, tokenHash, expiresAt) {
    if (!db.connected) throw new AppError('Database not available', 503);
    const user = await db.User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    user.reset_password_token_hash = tokenHash;
    user.reset_password_expires_at = expiresAt;
    user.reset_password_used = false;
    await user.save();
    return user;
  }

  async markResetTokenUsed(userId) {
    if (!db.connected) return null;
    return db.User.update(
      { reset_password_used: true },
      { where: { id: userId } }
    );
  }

  async delete(userId) {
    if (!db.connected) throw new AppError('Database not available', 503);
    const user = await db.User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    await user.destroy();
    return true;
  }
}

module.exports = new UserRepository();
