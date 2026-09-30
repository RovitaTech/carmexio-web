/**
 * Starter file for staff who build the sheet by hand. The same headers as the
 * WhatsApp Business catalog export, plus the columns the catalog doesn't have.
 */
export const TEMPLATE_CSV = [
  'id,title,description,availability,price,image_link,additional_image_link,brand,model,year,mileage,fuel_type,transmission,body_style,exterior_color,sucursal',
  'hilux-2022-001,Toyota Hilux 2022 SR,"Doble cabina, un dueño, servicios en agencia",in stock,615000,https://ejemplo.com/foto-frente.jpg,"https://ejemplo.com/foto-lado.jpg,https://ejemplo.com/foto-interior.jpg",Toyota,Hilux,2022,61200,diesel,manual,pickup,Blanco,Guadalajara',
].join('\r\n');
