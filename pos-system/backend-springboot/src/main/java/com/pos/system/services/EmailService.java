package com.pos.system.services;

import com.pos.system.models.Transaction;
import com.pos.system.models.TransactionItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendReceipt(Transaction transaction, String toEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Receipt for Transaction #" + transaction.getTransactionNumber());

            // Create Thymeleaf context
            Context context = new Context();
            context.setVariable("transaction", transaction);
            context.setVariable("items", transaction.getItems());
            context.setVariable("storeName", "Supermarket POS");
            context.setVariable("storeAddress", "123 Main Street, City");
            context.setVariable("storePhone", "(555) 123-4567");
            context.setVariable("dateTime", transaction.getCreatedAt()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
            context.setVariable("currency", NumberFormat.getCurrencyInstance(Locale.US));

            // Process template
            String htmlContent = templateEngine.process("receipt-email", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Receipt email sent to: {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send receipt email: {}", e.getMessage());
        }
    }

    @Async
    public void sendLowStockAlert(String productName, Integer currentStock, Integer minStock, String toEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Low Stock Alert: " + productName);

            Context context = new Context();
            context.setVariable("productName", productName);
            context.setVariable("currentStock", currentStock);
            context.setVariable("minStock", minStock);
            context.setVariable("storeName", "Supermarket POS");

            String htmlContent = templateEngine.process("low-stock-alert", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Low stock alert sent for: {}", productName);

        } catch (MessagingException e) {
            log.error("Failed to send low stock alert: {}", e.getMessage());
        }
    }
}