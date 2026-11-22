// Sentinel-5P CO: Monthly Mean, Minimum, Maximum
// November 2025 - October 2026

var AOI = geometry;
Map.centerObject(AOI, 5);

var startDate = ee.Date('2025-11-01');
var numberOfMonths = 12;
var endDate = startDate.advance(numberOfMonths, 'month');

var CO = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_CO')
  .filterBounds(AOI)
  .filterDate(startDate, endDate)
  .select('CO_column_number_density')
  .map(function(img) {
    return img.where(img.lt(0), 0)
      .copyProperties(img, ['system:time_start']);
  });

print('CO ImageCollection:', CO);
print('Number of images:', CO.size());

var monthOffsets = ee.List.sequence(0, numberOfMonths - 1);

function createMonthlyImage(offset, reducer, statistic) {
  var monthStart = startDate.advance(ee.Number(offset), 'month');
  var monthEnd = monthStart.advance(1, 'month');
  var monthlyCollection = CO.filterDate(monthStart, monthEnd);

  var bandName = ee.String('CO_')
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
      'image_count': CO.filterDate(monthStart, monthEnd).size()
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

    return ee.String('CO_')
      .cat(ee.String(statistic))
      .cat('_')
      .cat(date.format('YYYY_MM'));
  });

  return ee.ImageCollection.fromImages(monthlyImages)
    .toBands()
    .rename(bandNames);
}

// Monthly statistics
var CO_Mean = createMonthlyStack(ee.Reducer.mean(), 'mean');
var CO_Min = createMonthlyStack(ee.Reducer.min(), 'min');
var CO_Max = createMonthlyStack(ee.Reducer.max(), 'max');

// Inspect
print('CO Mean:', CO_Mean);
print('CO Min:', CO_Min);
print('CO Max:', CO_Max);

// Display
Map.addLayer(CO_Mean, {}, 'CO Mean');
Map.addLayer(CO_Min, {}, 'CO Min');
Map.addLayer(CO_Max, {}, 'CO Max');

// Export
Export.image.toDrive({
  image: CO_Mean,
  description: 'CO_Mean',
  folder: 'GEE_Exports',
  fileNamePrefix: 'CO_Mean',
  region: AOI,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: CO_Min,
  description: 'CO_Min',
  folder: 'GEE_Exports',
  fileNamePrefix: 'CO_Min',
  region: AOI,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: CO_Max,
  description: 'CO_Max',
  folder: 'GEE_Exports',
  fileNamePrefix: 'CO_Max',
  region: AOI,
  maxPixels: 1e13
});
