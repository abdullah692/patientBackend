const Appointments = require('./AppointmentsModel')
const AppointmentType = require('./AppointmentTypeModel')
const Availability = require('./AvailabilityModel')
const DentalPractice = require('./DentalPractice')
const Dentists = require('./DentistModel')
const DocsDentist = require('./DocsDentistModel')
const DocsPatient = require('./DocsPatientModel')
const Insurance = require('./InsuranceModel')
const NotificationsDentist = require('./NotificationsDentistModel')
const NotificationsPatient = require('./NotificationsPatientModel')
const Patients = require('./PatientModel')
const Dependent = require('./DependentModel')
const Qualification = require('./QualificationModel')
const Relation = require('./RelationsModel')
const Group = require('./Group')
const GroupMember = require('./GroupMembers')

Dentists.belongsTo(DentalPractice, { foreignKey: 'dp_id' })
DentalPractice.hasMany(Dentists, { foreignKey: 'dp_id' })

Availability.belongsTo(Dentists, { foreignKey: 'd_id' })
Dentists.hasMany(Availability, { foreignKey: 'd_id' })

DocsDentist.belongsTo(Dentists, { foreignKey: 'd_id' })
Dentists.hasMany(DocsDentist, { foreignKey: 'd_id' })

NotificationsDentist.belongsTo(Dentists, { foreignKey: 'd_id' })
Dentists.hasMany(NotificationsDentist, { foreignKey: 'd_id' })

Appointments.belongsTo(Patients, { foreignKey: 'p_id', as: 'patient', allowNull: true });
Patients.hasMany(Appointments, { foreignKey: 'p_id' })

Patients.belongsTo(Patients, { foreignKey: 'rel_id', as: 'partner', allowNull: true });

Appointments.belongsTo(Patients, { foreignKey: 'book_by_id', as: 'bookedBy', allowNull: true });
Appointments.belongsTo(Dependent, { foreignKey: 'dependent_id', as: 'dependent', allowNull: true });

Dependent.belongsTo(Patients, { foreignKey: 'insurance', as: 'insurance_inherit_from' });

Appointments.belongsTo(Availability, { foreignKey: 'av_id' })
Availability.hasMany(Appointments, { foreignKey: 'av_id' })

Appointments.belongsTo(AppointmentType, { foreignKey: 'at_id' })
AppointmentType.hasMany(Appointments, { foreignKey: 'at_id' })

AppointmentType.belongsTo(Dentists, { foreignKey: 'd_id' })
Dentists.hasMany(AppointmentType, { foreignKey: 'd_id' })

NotificationsPatient.belongsTo(Patients, { foreignKey: 'p_id' })
Patients.hasMany(NotificationsPatient, { foreignKey: 'p_id' })

DocsPatient.belongsTo(Patients, { foreignKey: 'p_id' })
Patients.hasMany(DocsPatient, { foreignKey: 'p_id' })

Appointments.belongsTo(Insurance, { foreignKey: 'ins_id' })
Insurance.hasMany(Appointments, { foreignKey: 'ins_id' })

Dependent.belongsTo(Patients, { foreignKey: 'created_by' })
Patients.hasMany(Dependent, { foreignKey: 'created_by' })

// PatientRelation.belongsTo(Relation, { foreignKey: 'relationId' })
// Relation.hasMany(PatientRelation, { foreignKey: 'relationId' })

Qualification.belongsTo(Dentists, { foreignKey: 'provider_id' })
Dentists.hasMany(Qualification, { foreignKey: 'provider_id' })

Group.belongsTo(Dentists, { foreignKey: 'leader_id' });
Dentists.hasMany(Group, { foreignKey: 'leader_id' });

GroupMember.belongsTo(Dentists, { foreignKey: 'provider_id' })
Dentists.hasMany(GroupMember, { foreignKey: 'provider_id' })

GroupMember.belongsTo(Group, { foreignKey: 'group_id' })
Group.hasMany(GroupMember, { foreignKey: 'group_id' })

Patients.belongsTo(Insurance, { foreignKey: 'ins_id' })