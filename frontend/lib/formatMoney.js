export default function(amount) {
  const options = {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  };

  const formatter = new Intl.NumberFormat('ke', options);
  return formatter.format(amount);
}

// export default function(amount) {
//   const options = {
//     style: 'currency',
//     currency: 'USD',
//     minimumFractionDigits: 2,
//   };
//   // if its a whole, dollar amount, leave off the .00
//   if (amount % 100 === 0) options.minimumFractionDigits = 0;
//   const formatter = new Intl.NumberFormat('en-US', options);
//   return formatter.format(amount / 100);
// }
