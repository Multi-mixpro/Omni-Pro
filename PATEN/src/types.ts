/**
 * Product Launch OS 3.0 - Type Definitions
 */

export type BusinessUnit = 'Mainline Studio' | 'Streetwear Co' | 'Activewear Lab';

export type ArticleStage =
  | 'Prospect'
  | 'Specification'
  | 'Source & Pattern'
  | 'Sampling'
  | 'Costing'
  | 'Production Plan'
  | 'Production'
  | 'Launch';

export type ArticleStatus =
  | 'Draft'
  | 'Prospect'
  | 'Ready Queue'
  | 'Active'
  | 'On Hold'
  | 'Blocked'
  | 'Ready for Production'
  | 'In Production'
  | 'Ready to Launch'
  | 'Launched'
  | 'Cancelled'
  | 'Archived';

export type ScheduleHealth = 'On Track' | 'At Risk' | 'Overdue' | 'Blocked' | 'No Baseline';

export type CostConfidence =
  | 'Low - Estimate'
  | 'Medium - Quoted'
  | 'High - Sample Verified'
  | 'Locked - Production'
  | 'Actual';

export type ProductionReadinessStatus = 'Not Ready' | 'Conditional' | 'Ready' | 'Approved';

export type CategoryType =
  | 'T-Shirt / Shirt'
  | 'Jacket / Hoodie'
  | 'Pants / Shorts'
  | 'Skirt / Dress'
  | 'Hat / Cap'
  | 'Bag / Backpack'
  | 'Accessory / Custom';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Pimpro' | 'Designer' | 'Pattern Maker' | 'Sourcing' | 'Sample / Prod' | 'QC' | 'Finance' | 'Marketing';
  avatar: string;
}

export interface ReferenceItem {
  id: string;
  type: 'image' | 'link' | 'note';
  url?: string;
  title: string;
  label: 'silhouette' | 'color' | 'material' | 'detail' | 'price' | 'competitor';
  note?: string;
}

export interface ArticleFile {
  id: string;
  name: string;
  url: string;
  kind: 'TECH_PACK' | 'REFERENCE' | 'SAMPLE_EVIDENCE' | 'SIZE_CHART' | 'OTHER';
  mimeType: string;
  bytes: number;
  uploadedAt: string;
}

export interface ArticleComment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  body: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  type: 'material' | 'accessory' | 'service' | 'factory' | 'workshop';
  address: string;
  picName: string;
  picContact: string;
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  paymentTerms: string;
  moqDefault: number;
  leadTimeDays: number;
  qualityScore: number; // 0 - 100
  onTimeDeliveryRate: number; // 0 - 100
  status: 'Active' | 'Inactive' | 'Blocked';
}

/** Tautan referensi eksternal untuk material (katalog warna, spec sheet, toko online). */
export interface MaterialLink {
  id: string;
  label: string;
  url: string;
  type: 'catalog' | 'color_chart' | 'spec' | 'shop' | 'other';
}

export interface MaterialMaster {
  id: string;
  code: string;
  name: string;
  group: 'main_fabric' | 'lining' | 'interlining' | 'rib' | 'zipper' | 'button' | 'thread' | 'label' | 'packaging' | 'accessory';
  composition: string;
  gsmOrWeight: string;
  width: string;
  stockUnit: string;
  purchaseUnit: string;
  conversionFactor: number; // stockUnit per purchaseUnit
  defaultWastePercent: number;
  preferredSupplierId: string;
  supplierName?: string;
  latestPrice: number;
  currency: string;
  availableColors?: string[];
  availableSizes?: string[];
  image?: string;
  /** Tautan katalog warna / spec sheet / toko dari supplier. */
  links?: MaterialLink[];
  moq: number;
  leadTimeDays: number;
  status: 'Active' | 'Draft' | 'Inactive';
}

export interface PriceRecord {
  id: string;
  supplierId: string;
  materialId?: string;
  serviceId?: string;
  price: number;
  currency: string;
  unit: string;
  validFrom: string;
  validTo: string;
  status: 'Valid' | 'Expiring' | 'Expired';
  approvedBy?: string;
  quotationFile?: string;
}

export interface ServiceMaster {
  id: string;
  code: string;
  name: string;
  category: string; // e.g. 'Pattern', 'Cutting', 'Sewing', 'Washing', 'Printing', 'QC & Packing'
  calculationMethod: 'per_unit' | 'per_batch' | 'fixed' | 'percentage';
  defaultRate: number;
  unitLabel: string;
  preferredSupplierId?: string;
}

export interface ArticleBOMItem {
  id: string;
  materialId: string;
  materialName: string;
  group: string;
  usageArea: string; // e.g., "Body Utama", "Rib Leher", "Furing Saku"
  supplierId: string;
  supplierName: string;
  netConsumption: number;
  consumptionUnit: string;
  wastePercent: number;
  grossConsumption: number;
  effectiveUnitPrice: number;
  priceSourceStatus: 'Valid' | 'Expiring' | 'Expired' | 'Manual';
  costPerProduct: number;
  isCustomOverride?: boolean;
  isCustomPrice?: boolean;
  overrideReason?: string;
}

export interface MeasurementField {
  id: string;
  code: string;
  labelId: string; // Indonesian Label
  aliasEn: string;
  category: CategoryType;
  measurementMethod: string;
  illustrationUrl?: string;
  defaultTolerance: number; // ± cm
  importance: 'Required' | 'Recommended' | 'Optional';
}

export interface SizeChartRow {
  fieldId: string;
  fieldName: string;
  tolerance: number;
  targetValues: Record<string, number>; // sizeCode -> cm value (e.g. { 'S': 68, 'M': 70, 'L': 72 })
  sampleActualValues?: Record<string, number>; // sizeCode -> actual cm
}

export interface Colorway {
  id: string;
  code: string;
  name: string;
  hex: string;
  secondaryHex?: string; // For jacket combinations / multi-color variants
  comboPartsNote?: string; // e.g., "Body Navy / Lengan Cream / Furing Orange"
  pantone?: string;
  swatchImage?: string;
  isSampleColor: boolean;
}

export interface SampleFinding {
  id: string;
  location: string;
  severity: 'Critical' | 'Major' | 'Minor';
  category: 'Fitting' | 'Pattern' | 'Sewing' | 'Fabric' | 'Trims';
  note: string;
  photoUrl?: string;
  status: 'Open' | 'Resolved';
}

export interface SampleIteration {
  id: string;
  iterationName: 'Sample V1' | 'Sample V2' | 'Sample V3' | 'Pre-Production' | 'Golden Sample';
  dateReceived: string;
  workshopName: string;
  targetSize: string;
  colorwayName: string;
  status: 'Pending Review' | 'Approved' | 'Approved with Revision' | 'Revision Required' | 'Rejected';
  measurementActuals: SizeChartRow[];
  findings: SampleFinding[];
  decisionNote?: string;
  isGoldenSample?: boolean;
}

export interface CostComponent {
  id: string;
  name: string;
  category: 'Material' | 'CMT & Service' | 'Packaging & Logistics' | 'Overhead & Allowance';
  calculationMethod: 'per_unit' | 'percentage' | 'fixed_allocated' | 'per_batch' | 'fixed';
  amount: number;
  isIncluded: boolean;
  isCustom: boolean;
}

export interface PatternSpecification {
  version: string;
  patternMaker: string;
  markerEfficiency: number;
  estimatedConsumption: number;
  unit: 'meter' | 'yard';
  notes: string;
  updatedAt: string;
}

export interface PriceSimulation {
  targetMarginPercent: number;
  sellingChannel: string;
  channelFeePercent: number;
  discountBufferPercent: number;
  suggestedMSRP: number;
  wholesalePrice: number;
  resellerPrice: number;
  projectedGrossMarginPercent: number;
  breakEvenQuantity: number;
}

export interface MatrixCell {
  colorId: string;
  sizeCode: string;
  plannedQty: number;
  cellBudget: number;
  cellRevenue: number;
}

export interface ProductionScenario {
  id: string;
  name: 'Conservative' | 'Base' | 'Aggressive' | 'Custom';
  matrix: MatrixCell[];
  totalQty: number;
  totalBudget: number;
  totalRevenue: number;
  grossMarginPercent: number;
  isSelectedPlan: boolean;
}

export interface ReadinessCheckItem {
  id: string;
  requirement: string;
  stage: ArticleStage;
  isCritical: boolean;
  isCompleted: boolean;
  ownerRole: string;
  sourceDoc?: string;
  overrideNote?: string;
}

export interface ProductionBatch {
  id: string;
  batchCode: string;
  vendorName: string;
  startDate: string;
  targetFinishDate: string;
  totalTargetQty: number;
  currentOperation: 'Cutting' | 'Sewing' | 'Finishing' | 'QC Inspection' | 'Packing' | 'Stock Ready';
  passedQty: number;
  rejectedQty: number;
  reworkQty: number;
  progressPercent: number;
}

export interface TaskItem {
  id: string;
  articleId?: string;
  articleCode?: string;
  articleTitle?: string;
  title: string;
  stage: ArticleStage;
  panelKey?: string;
  picId: string;
  picName: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Not Ready' | 'Ready' | 'In Progress' | 'Waiting' | 'Blocked' | 'In Review' | 'Completed';
  blockerReason?: string;
}

export interface BlockerItem {
  id: string;
  articleId: string;
  articleCode: string;
  title: string;
  severity: 'Critical' | 'Major' | 'Moderate';
  description: string;
  ownerName: string;
  reportedDate: string;
  targetResolutionDate: string;
  status: 'Open' | 'In Resolution' | 'Resolved';
}

export interface DecisionRequest {
  id: string;
  articleId: string;
  articleCode: string;
  question: string;
  options: string[];
  recommendedOption: string;
  impactDescription: string;
  requestedToName: string;
  dueDate: string;
  status: 'Pending' | 'Decided';
  selectedOption?: string;
  rationale?: string;
}

export interface ApprovalGate {
  id: string;
  articleId: string;
  articleCode: string;
  articleTitle: string;
  gateType: 'Brief Approval' | 'Specification Approval' | 'Sample Approval' | 'HPP Approval' | 'Production Release' | 'Launch Approval';
  requestedBy: string;
  requestedDate: string;
  approverRole: string;
  status: 'Pending' | 'Approved' | 'Revision Requested' | 'Rejected';
  versionTag: string;
  summaryNote: string;
  decidedBy?: string;
  decidedDate?: string;
  decisionNote?: string;
}

export interface ProgressUpdate {
  id: string;
  articleId: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
  updateType: 'Selesai' | 'Berjalan' | 'Hambatan' | 'Butuh Keputusan';
  notes: string;
  photoUrls?: string[];
  impactForecast?: string;
}

export interface ArticleWorkspacePanel {
  key: string;
  title: string;
  subtitle: string;
  isExpanded: boolean;
  isPinned: boolean;
  status: 'Complete' | 'Incomplete' | 'Needs Review' | 'Locked' | 'Not Applicable';
  completenessPercent: number;
  missingRequiredCount: number;
  ownerRole: string;
}

export interface Article {
  id: string;
  code: string;
  name: string;
  category: CategoryType;
  subCategory: string;
  businessUnit: BusinessUnit;
  genderTarget: 'Men' | 'Women' | 'Unisex' | 'Kids';
  seasonCollection: string;
  mainImage: string;
  galleryImages: string[];
  files?: ArticleFile[];
  teamComments?: ArticleComment[];
  stage: ArticleStage;
  status: ArticleStatus;
  
  // 5 Indicators
  workflowProgressPercent: number;
  dataCompletenessPercent: number;
  scheduleHealth: ScheduleHealth;
  costConfidence: CostConfidence;
  productionReadiness: ProductionReadinessStatus;

  // Targets
  targetSampleDate: string;
  targetReleaseDate: string;
  actualSampleDate?: string;
  actualReleaseDate?: string;

  // Team
  ownerName: string;
  pimproName: string;

  // Brief
  briefIntent: string;
  targetUserDescription: string;
  acceptanceCriteria: string;
  references: ReferenceItem[];
  targetPriceMSRP: number;
  targetHPP: number;

  // Specifications & Data
  materials: ArticleBOMItem[];
  colorways: Colorway[];
  sizeSet: string[]; // e.g. ['S', 'M', 'L', 'XL']
  baseSize: string; // e.g. 'M'
  sizeChart: SizeChartRow[];
  patternSpecification?: PatternSpecification;
  sampleIterations: SampleIteration[];

  // Costing
  costComponents: CostComponent[];
  calculatedHPP: number;
  priceSimulation: PriceSimulation;

  // Stock & Budget Matrix
  scenarios: ProductionScenario[];

  // Readiness
  readinessChecklist: ReadinessCheckItem[];

  // Production Batches
  batches: ProductionBatch[];

  // Launch Details
  copywriting?: string;
  sellingPoints?: string[];
  launchChecklist?: { item: string; done: boolean }[];

  // Metadata
  blockerCount: number;
  pendingApprovalCount: number;
  lastUpdated: string;
  workspacePanels: ArticleWorkspacePanel[];
}
