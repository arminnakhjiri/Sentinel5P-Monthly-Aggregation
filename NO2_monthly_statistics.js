// =====================================================
// Sentinel-5P NO2: Monthly Mean, Minimum, and Maximum
// =====================================================

// Define AOI
var AOI = geometry;

Map.centerObject(AOI, 5);

// Define the temporal period
var startDate = ee.Date('2025-11-01');
var numberOfMonths = 12;
var endDate = startDate.advance(numberOfMonths, 'month');

// Load Sentinel-5P OFFL NO2 collection
var NO2 = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_NO2')
  .filterBounds(AOI)
  .filterDate(startDate, endDate)
  .select('tropospheric_NO2_column_number_density')
  .map(function(img) {

    // Replace negative values with zero
    var no2 = img.where(img.lt(0), 0);

    return no2.copyProperties(img, ['system:time_start']);
  });

print('NO2 ImageCollection:', NO2);
print('Number of images:', NO2.size());

// Generate monthly offsets (0-11)
var monthOffsets = ee.List.sequence(0, numberOfMonths - 1);

// Function to create a monthly composite
function createMonthlyImage(offset, reducer, statistic) {

  var monthStart = startDate.advance(ee.Number(offset), 'month');
  var monthEnd = monthStart.advance(1, 'month');

  var monthlyCollection = NO2.filterDate(monthStart, monthEnd);

  var bandName = ee.String('NO2_')
    .cat(statistic)
    .cat('_')
    .cat(monthStart.format('YYYY_MM'));

  // Calculate the monthly statistic
  var monthlyImage = monthlyCollection
    .reduce(reducer)
    .rename(ee.List([bandName]))
    .clip(AOI)
    .set('system:time_start', monthStart.millis())
    .set('month', monthStart.format('YYYY-MM'));

  return monthlyImage;
}

// Check the number of available images in each month
var monthlyCounts = ee.FeatureCollection(
  monthOffsets.map(function(offset) {

    var monthStart = startDate.advance(ee.Number(offset), 'month');
    var monthEnd = monthStart.advance(1, 'month');

    var count = NO2.filterDate(monthStart, monthEnd).size();

    return ee.Feature(null, {
      'month': monthStart.format('YYYY-MM'),
      'image_count': count
    });
  })
);

print('Monthly observation counts:', monthlyCounts);

// Function to create a 12-band stacked image
function createMonthlyStack(reducer, statistic) {

  var monthlyImages = monthOffsets.map(function(offset) {
    return createMonthlyImage(offset, reducer, statistic);
  });

  // Generate the expected band names
  var bandNames = monthOffsets.map(function(offset) {

    var date = startDate.advance(ee.Number(offset), 'month');

    return ee.String('NO2_')
      .cat(ee.String(statistic))
      .cat('_')
      .cat(date.format('YYYY_MM'));
  });

  // Stack monthly images into one multi-band image
  var stackedImage = ee.ImageCollection
    .fromImages(monthlyImages)
    .toBands()
    .rename(bandNames);

  return stackedImage;
}

// Generate the three output images
var NO2_Mean = createMonthlyStack(
  ee.Reducer.mean(),
  'mean'
);

var NO2_Min = createMonthlyStack(
  ee.Reducer.min(),
  'min'
);

var NO2_Max = createMonthlyStack(
  ee.Reducer.max(),
  'max'
);

// Inspect the outputs
print('NO2 Monthly Mean:', NO2_Mean);
print('Mean band names:', NO2_Mean.bandNames());

print('NO2 Monthly Minimum:', NO2_Min);
print('Minimum band names:', NO2_Min.bandNames());

print('NO2 Monthly Maximum:', NO2_Max);
print('Maximum band names:', NO2_Max.bandNames());

// Display
Map.addLayer(NO2_Mean, {}, 'NO2 Mean');
Map.addLayer(NO2_Max, {}, 'NO2 Max');
Map.addLayer(NO2_Min, {}, 'NO2 Min');

// Export monthly mean
Export.image.toDrive({
  image: NO2_Mean,
  description: 'NO2_Mean',
  folder: 'GEE_Exports',
  fileNamePrefix: 'NO2_Mean',
  region: AOI,
  maxPixels: 1e13
});

// Export monthly minimum
Export.image.toDrive({
  image: NO2_Min,
  description: 'NO2_Min',
  folder: 'GEE_Exports',
  fileNamePrefix: 'NO2_Min',
  region: AOI,
  maxPixels: 1e13
});

// Export monthly maximum
Export.image.toDrive({
  image: NO2_Max,
  description: 'NO2_Max',
  folder: 'GEE_Exports',
  fileNamePrefix: 'NO2_Max',
  region: AOI,
  maxPixels: 1e13
});
