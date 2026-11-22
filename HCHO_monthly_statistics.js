// Sentinel-5P HCHO: Monthly Mean, Minimum, Maximum
// November 2025 - October 2026

var AOI = geometry;
Map.centerObject(AOI, 5);

var startDate = ee.Date('2025-11-01');
var numberOfMonths = 12;
var endDate = startDate.advance(numberOfMonths, 'month');

var HCHO = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_HCHO')
  .filterBounds(AOI)
  .filterDate(startDate, endDate)
  .select('tropospheric_HCHO_column_number_density')
  .map(function(img) {
    return img.where(img.lt(0), 0)
      .copyProperties(img, ['system:time_start']);
  });

print('HCHO ImageCollection:', HCHO);
print('Number of images:', HCHO.size());

var monthOffsets = ee.List.sequence(0, numberOfMonths - 1);

function createMonthlyImage(offset, reducer, statistic) {
  var monthStart = startDate.advance(ee.Number(offset), 'month');
  var monthEnd = monthStart.advance(1, 'month');
  var monthlyCollection = HCHO.filterDate(monthStart, monthEnd);

  var bandName = ee.String('HCHO_')
    .cat(statistic)
    .cat('_')
    .cat(monthStart.format('YYYY_MM'));

  return monthlyCollection.reduce(reducer)
    .rename(ee.List([bandName]))
    .clip(AOI)
    .set('system:time_start', monthStart.millis())
    .set('month', monthStart.format('YYYY-MM'));
}

// Monthly observation counts
var monthlyCounts = ee.FeatureCollection(
  monthOffsets.map(function(offset) {
    var monthStart = startDate.advance(ee.Number(offset), 'month');
    var monthEnd = monthStart.advance(1, 'month');

    return ee.Feature(null, {
      'month': monthStart.format('YYYY-MM'),
      'image_count': HCHO.filterDate(monthStart, monthEnd).size()
    });
  })
);

print('Monthly observation counts:', monthlyCounts);

function createMonthlyStack(reducer, statistic) {
  var monthlyImages = monthOffsets.map(function(offset) {
    return createMonthlyImage(offset, reducer, statistic);
  });

  var bandNames = monthOffsets.map(function(offset) {
    var date = startDate.advance(ee.Number(offset), 'month');

    return ee.String('HCHO_')
      .cat(ee.String(statistic))
      .cat('_')
      .cat(date.format('YYYY_MM'));
  });

  return ee.ImageCollection.fromImages(monthlyImages)
    .toBands()
    .rename(bandNames);
}

// Monthly statistics
var HCHO_Mean = createMonthlyStack(ee.Reducer.mean(), 'mean');
var HCHO_Min = createMonthlyStack(ee.Reducer.min(), 'min');
var HCHO_Max = createMonthlyStack(ee.Reducer.max(), 'max');

// Inspect
print('HCHO Mean:', HCHO_Mean);
print('HCHO Min:', HCHO_Min);
print('HCHO Max:', HCHO_Max);

// Display
Map.addLayer(HCHO_Mean, {}, 'HCHO Mean');
Map.addLayer(HCHO_Min, {}, 'HCHO Min');
Map.addLayer(HCHO_Max, {}, 'HCHO Max');

// Export
Export.image.toDrive({
  image: HCHO_Mean,
  description: 'HCHO_Mean',
  folder: 'GEE_Exports',
  fileNamePrefix: 'HCHO_Mean',
  region: AOI,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: HCHO_Min,
  description: 'HCHO_Min',
  folder: 'GEE_Exports',
  fileNamePrefix: 'HCHO_Min',
  region: AOI,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: HCHO_Max,
  description: 'HCHO_Max',
  folder: 'GEE_Exports',
  fileNamePrefix: 'HCHO_Max',
  region: AOI,
  maxPixels: 1e13
});
