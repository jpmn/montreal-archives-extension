function natural_sort(a, b) {
  var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?$|^0x[0-9a-f]+$|[0-9]+)/gi,
      sre = /(^[ ]*|[ ]*$)/g,
      dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
      hre = /^0x[0-9a-f]+$/i,
      ore = /^0/,
      i = function(s) { return natural_sort.insensitive && (''+s).toLowerCase() || ''+s },
      // convert all to strings strip whitespace
      x = i(a).replace(sre, '') || '',
      y = i(b).replace(sre, '') || '',
      // chunk/tokenize
      xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
      yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
      // numeric, hex or date detection
      xD = parseInt(x.match(hre)) || (xN.length != 1 && x.match(dre) && Date.parse(x)),
      yD = parseInt(y.match(hre)) || xD && y.match(dre) && Date.parse(y) || null,
      oFxNcL, oFyNcL;
  // first try and sort Hex codes or Dates
  if (yD)
    if ( xD < yD ) return -1;
    else if ( xD > yD ) return 1;
  // natural sorting through split numeric strings and default strings
  for(var cLoc=0, numS=Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
    // find floats not starting with '0', string or 0 if not defined (Clint Priest)
    oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
    oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
    // handle numeric vs string comparison - number < string - (Kyle Adams)
    if (isNaN(oFxNcL) !== isNaN(oFyNcL)) { return (isNaN(oFxNcL)) ? 1 : -1; }
    // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
    else if (typeof oFxNcL !== typeof oFyNcL) {
      oFxNcL += '';
      oFyNcL += '';
    }
    if (oFxNcL < oFyNcL) return -1;
    if (oFxNcL > oFyNcL) return 1;
  }
  return 0;
}

var $treeview = $('#treeview .unstyled');
var $imageflow = $('#imageflow_images');

var flag = undefined;

var attr_comparator = function(attr) {
  return function(a, b) {
    var content_a = a.getAttribute(attr);
    var content_b = b.getAttribute(attr);
    return natural_sort(content_a, content_b);
  }
}

var html_comparator = function(child) {
  return function(a, b) {
    if (child) {
      a = a.getElementsByTagName(child)[0];
      b = b.getElementsByTagName(child)[0];
    }
    var content_a = a.innerHTML;
    var content_b = b.innerHTML;
    return natural_sort(content_a, content_b);
  }
}

var sort_treeview = function() {
  var $more = $treeview.find('li.more:last-child');
  var $children = $treeview.find('li.ancestor:last').nextAll('li:not(.more)');
  $children.sort(attr_comparator('data-content'));
  $children.detach().appendTo($treeview);
  if ($more.length) {
    $more.detach().appendTo($treeview);
  }
}

var sort_treeview_per_html = function() {
  var $more = $treeview.find('li.more:last-child');
  var $children = $treeview.find('li.ancestor:last').nextAll('li:not(.more)');
  $children.sort(html_comparator('a'));
  $children.detach().appendTo($treeview);
  if ($more.length) {
    $more.detach().appendTo($treeview);
  }
}

var sort_imageflow = function() {
  var $children = $imageflow.find('img');
  $children.sort(attr_comparator('alt'));
  $children.detach().appendTo($imageflow);
}

var sort_imageflow_per_treeview = function() {
  var $children = $treeview.find('li.ancestor:last').nextAll('li:not(.more)');
  $($children.get().reverse()).each(function(i, elem) {
    var longdesc = $(this).find('a').attr('href');
    var $image = $imageflow.find('img[longdesc="'+longdesc+'"]');
    $image.detach().prependTo($imageflow);
  });
}

var execute = function() {
  sort_treeview_per_html();
  sort_imageflow_per_treeview();
}

if ($treeview.length) {
  execute();

  var obs = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].nodeType === 3) {
        clearTimeout(flag);
        flag = undefined;
        flag = setTimeout(function() {
          execute();
        }, 500);
      }
    });
  });

  obs.observe($treeview.get(0), { childList: true, subtree: false });
}
