// Sentinel-5P SO2: Monthly Mean, Minimum, Maximum
// November 2025 - October 2026

var AOI = geometry;
Map.centerObject(AOI, 5);

var startDate = ee.Date('2025-11-01');
var numberOfMonths = 12;
var endDate = startDate.advance(numberOfMonths, 'month');

var SO2 = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_SO2')
  .filterBounds(AOI)
  .filterDate(startDate, endDate)
  .select('SO2_column_number_density')
  .map(function(img) {
    return img.where(img.lt(0), 0)
      .copyProperties(img, ['system:time_start']);
  });

print('SO2 ImageCollection:', SO2);
print('Number of images:', SO2.size());

var monthOffsets = ee.List.sequence(0, numberOfMonths - 1);

function createMonthlyImage(offset, reducer, statistic) {
  var monthStart = startDate.advance(ee.Number(offset), 'month');
  var monthEnd = monthStart.advance(1, 'month');
  var monthlyCollection = SO2.filterDate(monthStart, monthEnd);

  var bandName = ee.String('SO2_')
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
      'image_count': SO2.filterDate(monthStart, monthEnd).size()
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

    return ee.String('SO2_')
      .cat(ee.String(statistic))
      .cat('_')
      .cat(date.format('YYYY_MM'));
  });

  return ee.ImageCollection.fromImages(monthlyImages)
    .toBands()
    .rename(bandNames);
}

// Monthly statistics
var SO2_Mean = createMonthlyStack(ee.Reducer.mean(), 'mean');
var SO2_Min = createMonthlyStack(ee.Reducer.min(), 'min');
var SO2_Max = createMonthlyStack(ee.Reducer.max(), 'max');

// Inspect
print('SO2 Mean:', SO2_Mean);
print('SO2 Min:', SO2_Min);
print('SO2 Max:', SO2_Max);

// Display
Map.addLayer(SO2_Mean, {}, 'SO2 Mean');
Map.addLayer(SO2_Min, {}, 'SO2 Min');
Map.addLayer(SO2_Max, {}, 'SO2 Max');

// Export
Export.image.toDrive({
  image: SO2_Mean,
  description: 'SO2_Mean',
  folder: 'GEE_Exports',
  fileNamePrefix: 'SO2_Mean',
  region: AOI,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: SO2_Min,
  description: 'SO2_Min',
  folder: 'GEE_Exports',
  fileNamePrefix: 'SO2_Min',
  region: AOI,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: SO2_Max,
  description: 'SO2_Max',
  folder: 'GEE_Exports',
  fileNamePrefix: 'SO2_Max',
  region: AOI,
  maxPixels: 1e13
});
