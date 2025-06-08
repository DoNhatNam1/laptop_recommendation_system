import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Laptop {
  id: string;
  name: string;
  usage: string;
  price: number;
  cpu: string;
  gpu: string | null;
  screen: number;
  screenName: string;
  battery: number;
  storage: string;
  ram: string;
  design: string;
  build_quality: string;
  performance: string;
}

async function main() {
  try {
    console.log('🔄 Bắt đầu quá trình seed dữ liệu...');

    // Xóa tất cả dữ liệu hiện có
    console.log('🧹 Đang xóa dữ liệu cũ...');
    const deleteCount = await prisma.laptops.deleteMany({});
    console.log(`✅ Đã xóa ${deleteCount.count} laptop cũ`);

    // Đọc file JSON
    console.log('📖 Đang đọc dữ liệu từ file JSON...');
    const jsonPath = path.join(__dirname, '..', 'consistent_laptops.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    let laptops = JSON.parse(jsonData) as Laptop[];

    // Lọc ra các đối tượng không phải laptop (nếu có)
    laptops = laptops.filter(laptop => 
      laptop && 
      laptop.id && 
      typeof laptop.id === 'string' && 
      laptop.name &&
      laptop.usage
    );

    console.log(`📊 Tìm thấy ${laptops.length} laptop trong file JSON`);

    // Biến đổi dữ liệu để phù hợp với schema
    const formattedLaptops = laptops.map(laptop => ({
      id: laptop.id,
      name: laptop.name,
      usage: laptop.usage,
      price: Number(laptop.price),
      cpu: laptop.cpu,
      gpu: laptop.gpu || null,
      screen: Number(laptop.screen),
      screen_name: laptop.screenName,
      battery: Number(laptop.battery),
      storage: laptop.storage,
      ram: laptop.ram,
      design: laptop.design,
      build_quality: laptop.build_quality,
      performance: laptop.performance
    }));

    // Nhập dữ liệu vào database
    console.log('💾 Đang nhập dữ liệu vào database...');
    
    // Thực hiện nhập theo lô để tránh lỗi nếu có quá nhiều dữ liệu
    const BATCH_SIZE = 50;
    for (let i = 0; i < formattedLaptops.length; i += BATCH_SIZE) {
      const batch = formattedLaptops.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map(laptop => 
          prisma.laptops.create({
            data: laptop
          })
        )
      );
      console.log(`✅ Đã nhập ${Math.min(i + BATCH_SIZE, formattedLaptops.length)} / ${formattedLaptops.length} laptop`);
    }

    console.log(`🎉 Hoàn thành! Đã thêm ${formattedLaptops.length} laptop vào database.`);
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('✨ Seed hoàn tất!');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Lỗi khi chạy seed:', e);
    process.exit(1);
  });